var require = {
    "paths":  {
        "es5-shim":  "empty:",
        "history":  "empty:",
        "json2":  "empty:",
        "linqjs":  "empty:",
        "rx":  "empty:",
        "rx.binding":  "empty:",
        "rx.experimental":  "empty:",
        "rx.time":  "empty:",
        "scalejs":  "Scripts/scalejs-0.2.7.30",
        "scalejs.functional":  "empty:",
        "scalejs.linq-linqjs":  "empty:",
        "scalejs.reactive":  "empty:",
        "scalejs.statechart-scion":  "empty:",
        "scion":  "empty:"
    },
    "scalejs":  {
        "extensions":  [
            "scalejs.functional",
            "scalejs.linq-linqjs",
            "scalejs.reactive",
            "scalejs.statechart-scion"
        ]
    },
    "shim":  {
        "history":  {
            "exports":  "History"
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
