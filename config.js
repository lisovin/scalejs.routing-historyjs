var require = {
    "paths":  {
        "es5-shim":  "empty:",
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
        "scion": "empty:",
        "history": "empty:"
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
        "scalejs.statechart-scion":  {
            "deps":  [
                "scalejs.linq-linqjs",
                "scalejs.functional"
            ]
        },
        "history": {
            "exports": "History"
        },
        "scalejs.navigation-history": {
            "deps": ["history"]
        }
    }
};
