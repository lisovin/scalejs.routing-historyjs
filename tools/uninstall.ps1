param($installPath, $toolsPath, $package, $project)

$project |
	Remove-Paths 'scalejs.navigation-history, history' |
	Remove-ScalejsExtension 'scalejs.navigation-history' |
	Remove-Shims 'history, scalejs.navigation-history'
	Out-Null
