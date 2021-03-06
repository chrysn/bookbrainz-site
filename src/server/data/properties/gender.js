var Model = require('../../helpers/model');

var Gender = new Model('Gender', {
	endpoint: 'gender'
});

Gender.extend({
	id: {
		type: 'number',
		map: 'gender_id'
	},
	name: {
		type: 'string'
	}
});

module.exports = Gender;
