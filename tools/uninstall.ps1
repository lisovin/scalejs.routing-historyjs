param($installPath, $toolsPath, $package, $project)

$project |
	Remove-Paths 'scalejs.routing-historyjs, history' |
	Remove-ScalejsExtension 'scalejs.routing-historyjs' |
	Remove-Shims 'history, scalejs.routing-historyjs'
	Out-Null
