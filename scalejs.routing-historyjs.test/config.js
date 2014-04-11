var require = {
    "baseUrl":  ".",
    "config":  {
        "scalejs.statechart-scion":  {
            "logStatesEnteredAndExited":  true
        }
    },
    "paths":  {
        "history":  "Scripts/native.history",
        "jasmine":  "Scripts/jasmine",
        "jasmine-html":  "Scripts/jasmine-html",
        "linqjs":  "Scripts/linq.min",
        "rx":  "Scripts/rx",
        "rx.binding":  "Scripts/rx.binding",
        "rx.coincidence":  "Scripts/rx.coincidence",
        "rx.experimental":  "Scripts/rx.experimental",
        "rx.joinpatterns":  "Scripts/rx.joinpatterns",
        "rx.time":  "Scripts/rx.time",
        "sandbox":  "Scripts/scalejs.sandbox",
        "scalejs":  "Scripts/scalejs-0.3.0.0",
        "scalejs.functional":  "Scripts/scalejs.functional-0.2.9.8",
        "scalejs.linq-linqjs":  "Scripts/scalejs.linq-linqjs-3.0.3.1",
        "scalejs.reactive":  "Scripts/scalejs.reactive-2.1.20.1",
        "scalejs.routing-historyjs":  "Scripts/scalejs.routing-historyjs-1.8.2.15",
        "scalejs.statechart-scion":  "Scripts/scalejs.statechart-scion-0.3.0.0",
        "scion":  "Scripts/scion"
    },
    "scalejs":  {
        "extensions":  [
            "scalejs.functional",
            "scalejs.linq-linqjs",
            "scalejs.reactive",
            "scalejs.routing-historyjs",
            "scalejs.statechart-scion"
        ]
    },
    "shim":  {
        "history":  {
            "exports":  "History"
        },
        "jasmine":  {
            "exports":  "jasmine"
        },
        "jasmine-html":  {
            "deps":  [
                "jasmine"
            ]
        },
        "scalejs.routing-historyjs":  {
            "deps":  [
                "history"
            ]
        },
        "scalejs.statechart-scion":  {
            "deps":  [
                "scalejs.linq-linqjs",
                "scalejs.functional"
            ]
        }
    }
};
