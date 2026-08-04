/*
 * local-runtime.js: local artifact capabilities shim. No Anthropic API,
 * no claude.ai runtime, no network calls. Everything runs on plain
 * browser APIs (Blob, <a download>, timers, in-memory cache).
 *
 * It mirrors the claude.ai artifact runtime surface (contract 0.1.14):
 *   - window.claude.downloads.save({filename, data})
 *   - window.claude.mcp.callTool / watchTool / listTools / invalidate
 *
 * If a real claude.ai runtime already installed a member, the shim
 * leaves it untouched, so the same feature code is portable to a
 * genuinely published artifact without changes.
 *
 * Local data sources replace viewer connectors. Register them BEFORE
 * feature code runs:
 *
 *   window.claudeLocal.registerTool("Analytics", "get_stats",
 *     async (input) => ({ visits: 1234 }));            // live local source
 *   window.claudeLocal.registerTool("Analytics", "snapshot",
 *     { visits: 1234 }, { description: "Static snapshot 2026-07-22" });
 *
 * Then use the standard surface:
 *   const r = await window.claude.mcp.callTool("Analytics", "get_stats", { range: "7d" });
 *   render(r.payload);
 */
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  var root = window.claude;
  if (!root || typeof root !== "object") {
    root = {};
    try { window.claude = root; } catch (e) { return; }
  }

  /* ------------------------------ downloads ------------------------------ */

  var EXT_ALLOWLIST = ["gif", "png", "jpg", "jpeg", "webp", "mp4", "webm", "txt", "json", "md"];
  var MIME_BY_EXT = {
    gif: "image/gif", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    webp: "image/webp", mp4: "video/mp4", webm: "video/webm",
    txt: "text/plain", json: "application/json", md: "text/markdown"
  };
  var MAX_BYTES = 16 * 1024 * 1024;
  var promptOpen = false;

  function downloadsError(code, message) {
    return { code: code, message: message };
  }

  function toBlob(data, mime) {
    if (typeof data === "string" && data.length) return new Blob([data], { type: mime });
    if (data instanceof Blob && data.size) return new Blob([data], { type: mime });
    if (data instanceof ArrayBuffer && data.byteLength) return new Blob([data], { type: mime });
    if (ArrayBuffer.isView(data) && data.byteLength) return new Blob([data], { type: mime });
    return null;
  }

  if (!root.downloads) {
    root.downloads = {
      save: function (request) {
        return new Promise(function (resolve, reject) {
          if (promptOpen) {
            return reject(downloadsError("rate_limited", "A save prompt is already open."));
          }
          if (!request || typeof request !== "object") {
            return reject(downloadsError("bad_request", "save() takes {filename, data}."));
          }
          var filename = request.filename;
          if (typeof filename !== "string" || !filename || filename.length > 512) {
            return reject(downloadsError("bad_request", "filename must be a non-empty string of at most 512 chars."));
          }
          var clean = filename.replace(/[\/\\:*?"<>|]+/g, "-").trim();
          var dot = clean.lastIndexOf(".");
          var ext = (dot > 0 ? clean.slice(dot + 1) : "").toLowerCase();
          if (EXT_ALLOWLIST.indexOf(ext) === -1) {
            return reject(downloadsError("rejected_extension",
              "Extension \"." + ext + "\" is outside the allowlist: " + EXT_ALLOWLIST.join(" ")));
          }
          var blob = toBlob(request.data, MIME_BY_EXT[ext]);
          if (!blob) {
            return reject(downloadsError("bad_request",
              "data must be a non-empty string, Blob, ArrayBuffer, or ArrayBufferView."));
          }
          if (blob.size > MAX_BYTES) {
            return reject(downloadsError("too_large", "File is over 16 MiB (" + blob.size + " bytes)."));
          }
          promptOpen = true;
          var accepted;
          try {
            accepted = window.confirm('Save "' + clean + '" (' + blob.size + " bytes)?");
          } finally {
            promptOpen = false;
          }
          if (!accepted) {
            return reject(downloadsError("declined", "The viewer declined the save."));
          }
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = clean;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
          resolve({ status: "saved" });
        });
      }
    };
  }

  /* --------------------------------- mcp --------------------------------- */

  var SEP = "\u0000";
  var registry = {};  // "server\0tool" -> {source, isStatic, description}
  var cache = {};     // identity -> {result, storedAt}
  var watchers = {};  // identity -> [{handler, timer, refresh}]

  function key(server, tool) { return server + SEP + tool; }

  function canonical(value) {
    if (value === undefined || value === null) return "null";
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    if (typeof value === "object") {
      return "{" + Object.keys(value).sort().map(function (k) {
        return JSON.stringify(k) + ":" + canonical(value[k]);
      }).join(",") + "}";
    }
    return JSON.stringify(value);
  }

  function identity(server, tool, input) {
    return key(server, tool) + SEP + canonical(input);
  }

  function mcpError(code, server, message, extra) {
    var err = { code: code, message: message };
    if (server !== undefined) err.server = server;
    if (extra) Object.keys(extra).forEach(function (k) { err[k] = extra[k]; });
    return err;
  }

  function envelope(payload) {
    var text = typeof payload === "string" ? payload : JSON.stringify(payload);
    var result = { content: [{ type: "text", text: text }], payload: payload };
    if (payload !== null && typeof payload === "object") result.structuredContent = payload;
    return result;
  }

  function cachedCopy(entry, revalidating) {
    var copy = {};
    Object.keys(entry.result).forEach(function (k) { copy[k] = entry.result[k]; });
    copy.cache = { storedAt: entry.storedAt, revalidating: !!revalidating };
    return copy;
  }

  function notifyData(id, result) {
    (watchers[id] || []).forEach(function (w) {
      try { w.handler({ type: "data", result: result }); } catch (e) { /* page bug */ }
    });
  }

  function execute(server, tool, input) {
    var entry = registry[key(server, tool)];
    if (!entry) {
      return Promise.reject(mcpError("server_not_connected", server,
        'No local source registered for "' + server + '" / "' + tool +
        '". Call window.claudeLocal.registerTool(...) before feature code runs.'));
    }
    try { JSON.stringify(input === undefined ? null : input); } catch (e) {
      return Promise.reject(mcpError("bad_request", server, "input must be plain JSON."));
    }
    return Promise.resolve()
      .then(function () {
        return entry.isStatic ? entry.source : entry.source(input === undefined ? null : input);
      })
      .then(function (payload) {
        var result = envelope(payload);
        cache[identity(server, tool, input)] = { result: result, storedAt: Date.now() };
        return result;
      })
      .catch(function (e) {
        if (e && e.code) throw e;
        throw mcpError("tool_error", server, (e && e.message) || String(e), { result: e });
      });
  }

  if (!root.mcp) {
    root.mcp = {
      callTool: function (server, tool, input, options) {
        if (typeof server !== "string" || typeof tool !== "string") {
          return Promise.reject(mcpError("bad_request", undefined, "server and tool must be strings."));
        }
        var opts = options || {};
        var id = identity(server, tool, input);
        var entry = cache[id];
        var staleTime = 0;
        var refresh = false;
        if (opts.cache && typeof opts.cache === "object") {
          staleTime = Math.min(opts.cache.staleTime || 0, 300000);
          refresh = !!opts.cache.refresh;
        }
        if (opts.cache === false) entry = null;
        if (refresh) entry = null;
        if (entry && Date.now() - entry.storedAt < staleTime) {
          return Promise.resolve(cachedCopy(entry, false));
        }
        return execute(server, tool, input).then(function (result) {
          notifyData(id, result);
          return result;
        });
      },

      watchTool: function (server, tool, input, handler, options) {
        if (typeof handler !== "function") {
          throw new TypeError("watchTool handler must be a function.");
        }
        var opts = options || {};
        var id = identity(server, tool, input);
        var w = { handler: handler, timer: null, refresh: null };
        (watchers[id] = watchers[id] || []).push(w);

        w.refresh = function () {
          execute(server, tool, input)
            .then(function (result) { notifyData(id, result); })
            .catch(function (err) {
              try { w.handler({ type: "error", error: err }); } catch (e) { /* page bug */ }
            });
        };

        Promise.resolve().then(function () {
          var entry = cache[id];
          if (entry) {
            try { w.handler({ type: "data", result: cachedCopy(entry, false) }); } catch (e) { /* page bug */ }
          } else {
            w.refresh();
          }
        });

        if (opts.refetchInterval) {
          w.timer = setInterval(w.refresh, Math.max(5000, opts.refetchInterval));
        }

        var done = false;
        return function unsubscribe() {
          if (done) return;
          done = true;
          if (w.timer) clearInterval(w.timer);
          watchers[id] = (watchers[id] || []).filter(function (x) { return x !== w; });
        };
      },

      invalidate: function (server, tool, input) {
        Object.keys(cache).forEach(function (id) {
          var match = true;
          if (server !== undefined) match = id.indexOf(server + SEP) === 0;
          if (match && tool !== undefined) match = id.indexOf(key(server, tool) + SEP) === 0;
          if (match && input !== undefined) match = id === identity(server, tool, input);
          if (match) {
            delete cache[id];
            var subs = watchers[id] || [];
            if (subs.length) subs[0].refresh();
          }
        });
        return Promise.resolve();
      },

      listTools: function () {
        var byServer = {};
        Object.keys(registry).forEach(function (k) {
          var parts = k.split(SEP);
          (byServer[parts[0]] = byServer[parts[0]] || []).push({
            name: parts[1],
            description: registry[k].description || ""
          });
        });
        return Promise.resolve({
          servers: Object.keys(byServer).map(function (s) {
            return { server: s, authStatus: "connected", tools: byServer[s] };
          })
        });
      }
    };
  }

  /* --------------------------- local registration ------------------------ */

  window.claudeLocal = window.claudeLocal || {};
  window.claudeLocal.registerTool = function (server, tool, source, opts) {
    if (typeof server !== "string" || typeof tool !== "string") {
      throw new TypeError("registerTool(server, tool, source): server and tool must be strings.");
    }
    registry[key(server, tool)] = {
      source: source,
      isStatic: typeof source !== "function",
      description: (opts && opts.description) || ""
    };
  };
})();
