```
{
	_id: null,
	'deptpeoplenow': {$sum: {$cond: [{$and: [{$lte: ['$createdAt', curMonthE]}]}, 1, 0]}},
	'deptpeoplepre': {$sum: {$cond: [{$and: [{$lte: ['$createdAt', perMonthE]}]}, 1, 0]}},
	'certificatepeoplenow': {$sum: {$cond: [{$and: [{$lte: ['$createdAt', curMonthE]}, {$eq: ['$aptitudeFlag', '1']}]}, 1, 0]}},
	'certificatepeoplepre': {$sum: {$cond: [{$and: [{$lte: ['$createdAt', perMonthE]}, {$eq: ['$aptitudeFlag', '1']}]}, 1, 0]}}
}

{ _id: "$dataSource", totalModalPrem: { "$sum": "$totalModalPrem" }, sagencyfee: { "$sum": "$agencyfee" } }

{
	_id: '$dialogistA',
	name: { $first: '$nameA' },
	unreadCount: { $sum: 1 }
}

{
	$group: {
		_id: { 'contractNo': '$contractNo', 'endorNo': '$endorNo', 'productName': '$productName' },
		totalPremium: { '$first': "$totalModalPrem" },
		extaxPremium: { '$first': "$extaxModalPrem" },
		totalAgencyFee: { $sum: "$amount" },
		count: { $sum: 1 }
	}
}, {
	$group: {
		_id: { 'contractNo': '$_id.contractNo', 'endorNo': '$_id.endorNo' },
		totalPremium: { $sum: "$totalPremium" },
		extaxPremium: { $sum: "$extaxPremium" },
		totalAgencyFee: { $sum: "$totalAgencyFee" },
		total: { $sum: '$count' }
	}
}

{
	'_id': {
		'year': '$year',
		'month': '$month',
		'branch': '$branchCode'
	},
	sum: {'$sum': 1}
}

$group._id = { acceptDate: { "$month": "$acceptDate" }}

{ '$group': { '_id': '', 'totalModalPrem': { '$sum': '$totalModalPrem' } } }

{
	_id: {
		planAttrType: '$children.planAttrType'
	},
	sTotalModalPrem: {$sum: '$children.totalModalPrem'},
	sExtaxModalPrem: {$sum: '$children.extaxModalPrem'},
	sAgencyfee: {$sum: '$children.agencyfee'}
}

{
	_id: {},
	sum: { $sum: 1 },
	benchPremium: { $sum: '$benchPremium' },
	totalModalPrem: { $sum: '$totalModalPrem' },
	agencyfee: { $sum: '$agencyfee' },
	//commissionPrem: { $sum: '$commissionPrem' },
	commissionPrem: { $sum: {$add:['$commissionPrem','$firstRecomm','$secondRecomm']}}
}
```