param($installPath, $toolsPath, $package, $project)

$project |
	Add-Paths "{
		'scalejs.routing-history' : 'Scripts/scalejs.routing-history-$($package.Version)'
	}" |
	Add-ScalejsExtension 'scalejs.routing-history' |
	Out-Null