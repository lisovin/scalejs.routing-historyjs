param($installPath, $toolsPath, $package, $project)

$project |
	Add-Paths "{
		'scalejs.routing-historyjs' : 'Scripts/scalejs.routing-historyjs-$($package.Version)'
	}" |
	Add-ScalejsExtension 'scalejs.routing-historyjs' |
	Out-Null