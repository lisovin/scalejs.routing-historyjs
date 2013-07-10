param($installPath, $toolsPath, $package, $project)

$project |
	Remove-Paths 'scalejs.routing-historyjs' |
	Remove-ScalejsExtension 'scalejs.routing-historyjs' |
	Out-Null
