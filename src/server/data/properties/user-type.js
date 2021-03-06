var Model = require('../../helpers/model');

var UserType = new Model('UserType', {
	endpoint: 'userType'
});

UserType.extend({
	id: {
		type: 'number',
		map: 'user_type_id'
	},
	label: {
		type: 'string'
	}
});

module.exports = UserType;
