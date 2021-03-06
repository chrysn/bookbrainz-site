var Model = require('../helpers/model');
var Alias = require('../data/properties/alias');
var Annotation = require('../data/properties/annotation');
var Disambiguation = require('../data/properties/disambiguation');
var Relationship = require('../data/relationship');

var Entity = new Model('Entity', {
	abstract: true,
	endpoint: 'entity'
});

Entity.extend({
	bbid: {
		type: 'uuid',
		map: 'entity_gid'
	},
	default_alias: {
		type: 'object',
		model: 'Alias'
	},
	revision: {
		type: 'object'
	},
	aliases: {
		type: 'ref',
		model: 'Alias',
		many: true,
		map: 'aliases_uri'
	},
	disambiguation: {
		type: 'ref',
		model: 'Disambiguation',
		map: 'disambiguation_uri'
	},
	annotation: {
		type: 'ref',
		model: 'Annotation',
		map: 'annotation_uri'
	},
	relationships: {
		type: 'ref',
		model: 'Relationship',
		map: 'relationships_uri',
		many: true
	},
	last_updated: {
		type: 'date'
	}
});

module.exports = Entity;
