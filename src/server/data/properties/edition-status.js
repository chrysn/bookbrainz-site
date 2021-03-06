var Model = require('../../helpers/model');

var EditionStatus = new Model('EditionStatus', {
	endpoint: 'editionStatus'
});

EditionStatus.extend({
	id: {
		type: 'number',
		map: 'edition_status_id'
	},
	label: {
		type: 'string'
	}
});

module.exports = EditionStatus;
