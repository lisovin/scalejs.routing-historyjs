param($installPath, $toolsPath, $package, $project)

$project |
	Add-Paths "{
		'scalejs.navigation-history' : 'Scripts/scalejs.navigation-history-$($package.Version)',
		'history': 'Scripts/native.history'
	}" |
	Add-Shims "{
		'history': {
			exports: 'History'
		},
		'scalejs.navigation-history': {
			deps: ['history']
		}
	}" |
	Add-ScalejsExtension 'scalejs.navigation-history' |
	Out-Null