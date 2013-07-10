param($installPath, $toolsPath, $package, $project)

$project |
	Remove-Paths 'scalejs.routing-history' |
	Remove-ScalejsExtension 'scalejs.routing-history' |
	Out-Null
