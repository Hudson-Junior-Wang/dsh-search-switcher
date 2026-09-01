window.__ModuleLoader__.load({
  id: "dsh-search-switcher",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    const react = require("react");
    const react_jsx_runtime = require("react/jsx-runtime");

    //#region constants
    const NS = "dsh-search-switcher";
    const BRIDGE_PREFIX = "/api/dsh-free-search-settings";
    const FREE_SEARCH_NS = "free-search";

    /** Mirrors dsh-free-search's ENGINES list (client.js) — labels/badges only, no keys. */
    const ENGINES = [
      { id: "ddg", label: "DuckDuckGo · HTML", badge: "FREE" },
      { id: "ddg-lite", label: "DuckDuckGo · Lite", badge: "FREE" },
      { id: "bing", label: "Bing", badge: "FREE" },
      { id: "anysearch", label: "AnySearch · AI", badge: "FREE" },
      { id: "searxng", label: "SearXNG · Meta", badge: "FREE" },
      { id: "exa", label: "Exa", badge: "FREE" },
      { id: "tavily", label: "Tavily", badge: "FREE" },
      { id: "keenable", label: "Keenable", badge: "FREE" },
      { id: "perplexity", label: "Perplexity", badge: "API KEY" },
      { id: "deepseek-official", label: "DeepSeek Official", badge: "API KEY" },
    ];
    const DEFAULT_ENGINE = "bing";

    /** Short engine label for the trigger (strip the " · suffix" detail). */
    function shortLabel(engine) {
      const entry = ENGINES.find((e) => e.id === engine);
      return entry ? entry.label.split(" · ")[0] : (engine ?? DEFAULT_ENGINE);
    }
    //#endregion

    //#region css
    const css = [
      ".dshss-root{min-width:0;position:relative}",
      ".dshss-trigger{min-width:0;max-width:160px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:24px;outline:none;align-items:center;gap:4px;padding:0 4px 0 8px;font-size:13px;font-weight:500;line-height:20px;display:flex}",
      ".dshss-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}",
      ".dshss-trigger:disabled{opacity:.6;cursor:default}",
      ".dshss-triggerLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}",
      ".dshss-chevron{color:var(--dsw-alias-label-caption);flex:none;transition:transform .12s}",
      ".dshss-chevronOpen{transform:rotate(180deg)}",
      ".dshss-menu{z-index:20;border:1px solid var(--dsw-alias-border-inverted);background:var(--dsw-specific-menu);width:min(240px,100vw - 32px);max-height:min(360px,100vh - 96px);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-primary);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);border-radius:12px;flex-direction:column;padding:4px;display:flex;position:absolute;bottom:calc(100% + 8px);right:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain}",
      ".dshss-status{color:var(--dsw-alias-label-tertiary);padding:10px;font-size:13px;line-height:20px}",
      ".dshss-error{color:var(--dsw-alias-state-error-primary);padding:10px;font-size:12px;line-height:18px}",
      ".dshss-groupTitle{color:var(--dsw-alias-label-tertiary);padding:5px 8px 3px;font-size:12px;font-weight:500;line-height:18px}",
      ".dshss-option{width:100%;min-height:38px;color:inherit;text-align:left;cursor:pointer;background:0 0;border:none;border-radius:10px;outline:none;align-items:center;gap:8px;padding:6px 8px;display:flex}",
      ".dshss-option:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}",
      ".dshss-option:disabled{opacity:.6;cursor:default}",
      ".dshss-optionCopy{flex-direction:column;flex:1;min-width:0;display:flex}",
      ".dshss-optionLabel{color:inherit;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:500;line-height:20px;overflow:hidden}",
      ".dshss-optionBadge{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px;overflow:hidden}",
      ".dshss-check{color:var(--dsw-alias-label-primary);flex:0 0 18px;place-items:center;display:grid}",
    ].join("");
    const tagId = "dsh-search-switcher/card.css";
    if (typeof document !== "undefined") {
      const styleSelector = `style[data-plugin-css=${JSON.stringify(tagId)}]`;
      const existing = document.querySelector(styleSelector);
      if (existing !== null) {
        existing.textContent = css;
      } else {
        const tag = document.createElement("style");
        tag.dataset.plugin = "dsh-search-switcher";
        tag.dataset.pluginCss = tagId;
        tag.textContent = css;
        document.head.appendChild(tag);
      }
    }
    //#endregion

    //#region bridge
    async function bridgeDescribe() {
      const response = await fetch(`${BRIDGE_PREFIX}/describe`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      return response.json();
    }

    async function bridgeMutate(payload) {
      const response = await fetch(`${BRIDGE_PREFIX}/mutate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return response.json();
    }

    async function currentEngine() {
      try {
        const result = await bridgeDescribe();
        const view = result.ok ? result.value.namespaces.find((n) => n.ns === FREE_SEARCH_NS) : undefined;
        return view?.value?.provider ?? DEFAULT_ENGINE;
      } catch {
        return DEFAULT_ENGINE;
      }
    }
    //#endregion

    //#region SearchSwitcher component
    /**
     * Composer seat rendered left of the model picker (`conversation.input.right`).
     * Trigger shows the current search engine; the popup lists all engines of
     * dsh-free-search and switches the `free-search.provider` setting on click.
     */
    function SearchSwitcher({ locked = false }) {
      const [open, setOpen] = react.useState(false);
      const [engine, setEngine] = react.useState(DEFAULT_ENGINE);
      const [status, setStatus] = react.useState("idle"); // idle | loading | error
      const [error, setError] = react.useState(null);
      const rootRef = react.useRef(null);
      const triggerRef = react.useRef(null);
      const menuRef = react.useRef(null);
      const id = react.useId();

      react.useEffect(() => {
        let cancelled = false;
        currentEngine().then((value) => {
          if (!cancelled) setEngine(value);
        });
        return () => {
          cancelled = true;
        };
      }, []);

      react.useEffect(() => {
        if (!open) return;
        const closeOutside = (event) => {
          if (!rootRef.current?.contains(event.target)) setOpen(false);
        };
        document.addEventListener("mousedown", closeOutside);
        return () => {
          document.removeEventListener("mousedown", closeOutside);
        };
      }, [open]);

      // When the menu opens, move focus to the option for the current engine
      // (falling back to the first option) so keyboard users land inside it.
      react.useEffect(() => {
        if (!open) return;
        const menu = menuRef.current;
        if (!menu) return;
        const option =
          menu.querySelector(`[data-engine="${engine}"]`) ??
          menu.querySelector('[role="menuitemradio"]');
        option?.focus();
      }, [open, engine]);

      const show = () => {
        setStatus("idle");
        setError(null);
        setOpen(true);
      };
      const close = (restoreFocus = false) => {
        setOpen(false);
        if (restoreFocus) queueMicrotask(() => {
          triggerRef.current?.focus();
        });
      };

      const onRootKeyDown = (event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          close(true);
        }
      };
      const onBlur = (event) => {
        if (event.relatedTarget instanceof Node && rootRef.current?.contains(event.relatedTarget)) return;
        close();
      };

      // Arrow/Home/End move between options; Enter/Space activate the focused
      // option natively, and Escape is handled on the root (closes + restores
      // focus to the trigger).
      const onMenuKeyDown = (event) => {
        const menu = menuRef.current;
        if (!menu || status === "loading") return;
        const options = Array.from(menu.querySelectorAll('[role="menuitemradio"]'));
        if (options.length === 0) return;
        const currentIndex = options.indexOf(document.activeElement);
        const moveTo = (index) => {
          event.preventDefault();
          options[index]?.focus();
        };
        switch (event.key) {
          case "ArrowDown":
            moveTo(currentIndex === -1 ? 0 : (currentIndex + 1) % options.length);
            break;
          case "ArrowUp":
            moveTo(currentIndex === -1 ? options.length - 1 : (currentIndex - 1 + options.length) % options.length);
            break;
          case "Home":
            moveTo(0);
            break;
          case "End":
            moveTo(options.length - 1);
            break;
        }
      };

      const choose = async (engineId) => {
        if (engineId === engine) {
          close(true);
          return;
        }
        setStatus("loading");
        setError(null);
        try {
          const result = await bridgeMutate({
            ns: FREE_SEARCH_NS,
            ops: [{ op: "set", path: ["provider"], value: engineId }],
          });
          if (result.ok !== true) {
            setStatus("error");
            setError(result.error?.message ?? "switch failed");
            return;
          }
          const view = result.value?.namespaces?.find((n) => n.ns === FREE_SEARCH_NS) ?? result.value;
          setEngine(view?.value?.provider ?? engineId);
          close(true);
        } catch (caught) {
          setStatus("error");
          setError(String(caught));
        }
      };

      const label = shortLabel(engine);
      return react_jsx_runtime.jsxs("div", {
        ref: rootRef,
        className: "dshss-root",
        onKeyDown: onRootKeyDown,
        onBlur,
        children: [
          react_jsx_runtime.jsxs("button", {
            ref: triggerRef,
            type: "button",
            className: "dshss-trigger",
            "aria-label": `Search engine: ${label}`,
            "aria-haspopup": "menu",
            "aria-expanded": open,
            "aria-controls": open ? `${id}-menu` : undefined,
            title: `Search engine: ${label}`,
            disabled: locked,
            onClick: () => {
              if (open) close();
              else show();
            },
            onKeyDown: (event) => {
              // Open the menu from the trigger with the arrow keys as well.
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                if (!open) show();
              }
            },
            children: [
              react_jsx_runtime.jsx("span", {
                className: "dshss-triggerLabel",
                children: label,
              }),
              react_jsx_runtime.jsx("svg", {
                viewBox: "0 0 16 16",
                width: "14",
                height: "14",
                "aria-hidden": true,
                className: open ? "dshss-chevron dshss-chevronOpen" : "dshss-chevron",
                children: react_jsx_runtime.jsx("path", {
                  d: "M4 6l4 4 4-4",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "1.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                }),
              }),
            ],
          }),
          open && react_jsx_runtime.jsxs("div", {
            id: `${id}-menu`,
            ref: menuRef,
            className: "dshss-menu",
            role: "menu",
            "aria-label": "Search engine",
            "aria-busy": status === "loading",
            onKeyDown: onMenuKeyDown,
            children: [
              status === "loading" && react_jsx_runtime.jsx("div", {
                className: "dshss-status",
                children: "Switching…",
              }),
              status === "error" && error !== null && react_jsx_runtime.jsx("div", {
                className: "dshss-error",
                children: String(error),
              }),
              status !== "loading" && react_jsx_runtime.jsx("div", {
                className: "dshss-groupTitle",
                children: "Search engine",
              }),
              status !== "loading" && ENGINES.map((entry) => {
                const selected = entry.id === engine;
                return react_jsx_runtime.jsxs("button", {
                  type: "button",
                  role: "menuitemradio",
                  "aria-checked": selected,
                  className: "dshss-option",
                  "data-engine": entry.id,
                  title: entry.label,
                  disabled: status === "loading",
                  onClick: () => {
                    void choose(entry.id);
                  },
                  children: [
                    react_jsx_runtime.jsxs("span", {
                      className: "dshss-optionCopy",
                      children: [
                        react_jsx_runtime.jsx("span", {
                          className: "dshss-optionLabel",
                          children: entry.label,
                        }),
                        react_jsx_runtime.jsx("span", {
                          className: "dshss-optionBadge",
                          children: entry.badge,
                        }),
                      ],
                    }),
                    selected && react_jsx_runtime.jsx("span", {
                      className: "dshss-check",
                      children: react_jsx_runtime.jsx("svg", {
                        viewBox: "0 0 16 16",
                        width: "16",
                        height: "16",
                        "aria-hidden": true,
                        children: react_jsx_runtime.jsx("path", {
                          d: "M3 8.5L6.5 12 13 4.5",
                          fill: "none",
                          stroke: "currentColor",
                          strokeWidth: "1.8",
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                        }),
                      }),
                    }),
                  ],
                }, entry.id);
              }),
            ],
          }),
        ],
      });
    }
    //#endregion

    //#region client plugin
    const inject = ["slots", "locale"];

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, {
        zh: {
          "trigger.label": "搜索引擎",
        },
        en: {
          "trigger.label": "Search engine",
        },
      }), "dsh-search-switcher: dictionaries");
      ctx.inject(["slots"], (scope) => {
        scope.slots.inject("conversation.input.right", () => scope.slots.register({
          name: "conversation.input.right",
          id: "search-engine",
          locale: NS,
          order: 10,
          inject: () => ({}),
        }, SearchSwitcher));
      });
    }
    //#endregion

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
