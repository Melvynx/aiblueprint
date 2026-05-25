Install and configure tmux with Ghostty on macOS. This sets up a minimalist tmux with direct keyboard shortcuts (no prefix needed for common actions), auto-naming tabs, session persistence, and a clean status bar.

## Step 1: Install tmux

```bash
brew install tmux
```

## Step 2: Install TPM (plugin manager)

```bash
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```

## Step 3: Write `~/.tmux.conf`

```
# Mouse
set -g mouse on

# Start at 1
set -g base-index 1
setw -g pane-base-index 1

# Prefix = Ctrl+A
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# Visual feedback when prefix is pressed
set -g status-left '#{?client_prefix,#[fg=green bold] TMUX ,}'

# Actions (Ctrl+A puis...)
bind c new-window -c "#{pane_current_path}"
bind s split-window -h -c "#{pane_current_path}"
bind d split-window -v -c "#{pane_current_path}"
bind w kill-pane
bind r command-prompt -I "#W" "rename-window '%%'"
bind f copy-mode
bind h list-keys

# Switch panes (no prefix)
bind -n M-Left select-pane -L
bind -n M-Right select-pane -R
bind -n M-Up select-pane -U
bind -n M-Down select-pane -D

# Switch windows (no prefix)
bind -n S-Left previous-window
bind -n S-Right next-window

# Settings
set -g history-limit 50000
set -sg escape-time 0
set -g default-terminal "screen-256color"
set -ag terminal-overrides ",xterm-256color:RGB"
set -g renumber-windows on

# Minimal status bar
set -g status-position bottom
set -g status-style 'bg=default fg=#555555'
set -g status-right '#[fg=#555555]#S'
set -g allow-rename on
set -g set-titles on
set -g set-titles-string '#{pane_title}'
setw -g automatic-rename on
setw -g automatic-rename-format '#{pane_title}'
setw -g window-status-format '#[fg=#555555] #I:#W'
setw -g window-status-current-format '#[fg=white,bold] #I:#W'
set -g status-justify left

# Pane borders
set -g pane-border-style 'fg=#333333'
set -g pane-active-border-style 'fg=#555555'

# Plugins
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'
set -g @plugin 'tmux-plugins/tmux-yank'

set -g @resurrect-capture-pane-contents 'on'
set -g @continuum-restore 'on'

run '~/.tmux/plugins/tpm/tpm'
```

## Step 4: Add Ghostty keybinds

Add these lines to `~/Library/Application Support/com.mitchellh.ghostty/config`:

```
keybind = ctrl+shift+t=text:\x01c
keybind = ctrl+shift+s=text:\x01s
keybind = ctrl+shift+d=text:\x01d
keybind = ctrl+shift+w=text:\x01w
keybind = ctrl+shift+r=text:\x01r
macos-option-as-alt = left
```

`macos-option-as-alt = left` is required for Alt+Arrow pane switching to work.

## Step 5: Install plugins

```bash
~/.tmux/plugins/tpm/bin/install_plugins
```

## Step 6: Reload

```bash
tmux source-file ~/.tmux.conf
```

Then restart Ghostty (Cmd+Q and reopen).

## Shortcuts

### Direct shortcuts (no prefix)

| Action | Shortcut |
| --- | --- |
| New tab | `Ctrl+Shift+T` |
| Split côte à côte | `Ctrl+Shift+S` |
| Split haut/bas | `Ctrl+Shift+D` |
| Fermer pane | `Ctrl+Shift+W` |
| Renommer tab | `Ctrl+Shift+R` |
| Changer de pane | `Alt + Flèches` |
| Changer de tab | `Shift + Left/Right` |
| Scroll | Molette souris |

### Prefix shortcuts (Ctrl+A puis...)

When you press Ctrl+A, " TMUX " appears in green = tmux is listening.

| Touche | Action |
| --- | --- |
| `c` | nouveau tab |
| `s` | split côte à côte |
| `d` | split haut/bas |
| `w` | fermer pane |
| `r` | renommer tab |
| `f` | mode scroll |
| `h` | voir tous les raccourcis |
| `1-9` | aller au tab N |

### Sessions

| Action | Command |
| --- | --- |
| Nouvelle session | `tmux new -s nom` |
| Lister sessions | `tmux ls` |
| Se rattacher | `tmux a` |
| Détacher | `Ctrl+A` puis `d` |

## Plugins installed

- **tmux-resurrect**: save/restore sessions (survives reboot)
- **tmux-continuum**: auto-restore last session on launch
- **tmux-yank**: copy in tmux goes to system clipboard
