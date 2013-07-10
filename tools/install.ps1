param($installPath, $toolsPath, $package, $project)

$project |
	Add-Paths "{
		'scalejs.routing-historyjs' : 'Scripts/scalejs.routing-historyjs-$($package.Version)',
		'history': 'Scripts/native.history'
	}" |
	Add-Shims "{
		'history': {
			exports: 'History'
		},
		'scalejs.routing-historyjs': {
			deps: ['history']
		}
	}" |
	Add-ScalejsExtension 'scalejs.routing-historyjs' |
	Out-Null