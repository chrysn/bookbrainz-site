var ko = require('knockout');
var request = require('superagent');
var $ = require('jquery');
var renderRelationship = require('../../src/server/helpers/render');
var Promise = require('bluebird');
var utils = require('../../src/server/helpers/utils');
require('superagent-bluebird-promise');

var ws = 'https://bookbrainz.org/ws';
var entityGid = $('#entityContainer').attr('data-entity-gid');


function RelationshipEditor(relationships, relationshipTypes) {
	var self = this;

	self.relationshipTypes = relationshipTypes.objects;

	self.currentRelationshipType = ko.observable(self.relationshipTypes[0]);

	self.entityGids = ko.observableArray([{
		gid: ko.observable(entityGid),
		disabled: ko.observable(true)
	}, {
		gid: ko.observable(),
		disabled: ko.observable(false)
	}]);

	self.entities = ko.observableArray();
	ko.computed(function() {
		var temp = self.entityGids().map(function(gid) {
			return utils.getEntity(ws, gid.gid(), {
				aliases: true,
			});
		});

		return Promise.all(temp).then(function(entities) {
			self.entities(entities);
		}).
		catch(function(err) {});
	}).extend({
		rateLimit: {
			timeout: 500,
			method: 'notifyWhenChangesStop'
		}
	});

	self.renderedRelationship = ko.computed(function() {
		var temp = renderRelationship(self.entities(), self.currentRelationshipType(), 1);
		return temp;
	});

	self.swap = function(index) {
		console.log(index);
		var temp = {
			gid: self.entityGids()[index + 1].gid(),
			disabled: self.entityGids()[index + 1].disabled()
		};

		self.entityGids()[index + 1].gid(self.entityGids()[index].gid());
		self.entityGids()[index + 1].disabled(self.entityGids()[index].disabled());

		self.entityGids()[index].gid(temp.gid);
		self.entityGids()[index].disabled(temp.disabled);
	};

	this.lastEntity = function(index) {
		return index === (self.entityGids().length - 1);
	};

	this.gidComplete = function(gid) {
		return gid.length == 36;
	};

	self.existingRelationships = ko.observableArray();
	self.existingRelationships().forEach(function(relationship) {
		relationship.entities.forEach(function(entity, entityIndex) {
			getEntity(ws, entity.gid, {
					aliases: true
				})
				.then(function(fetchedEntity) {
					relationship.entities[entityIndex] = fetchedEntity;
					relationship.rendered = renderRelationship(relationship.entities, relationship.type, 1);
				});
		});
	});

	self.addedRelationships = ko.observableArray();
	self.processRelationship = function() {
		self.addedRelationships.push({
			type: self.currentRelationshipType(),
			rendered: self.renderedRelationship(),
			entities: self.entities()
		});
	};

	self.removeRelationship = function(test) {
		self.addedRelationships.remove(test);
	};

	self.relationshipComplete = ko.computed(function(test) {
		return self.entities().length > 0;
	});

	self.submit = function() {
		request.post('./relationships/handler').
		send(self.addedRelationships().map(function(relationship) {
			return {
				id: [],
				relationship_type: {
					relationship_type_id: relationship.type.relationship_type_id
				},
				entities: relationship.entities.map(function(entity, index) {
					return {
						entity_gid: entity.entity_gid,
						position: index
					};
				})
			};
		})).promise().then(function(revision) {
			utils.getEntity(ws, entityGid, {})
				.then(function fulfillRedirectEntity(entity) {
					window.location.href = utils.getEntityLink(entity);
				});
		}).
		catch(function(err) {
			self.error(err);
		});
	};

	self.error = ko.observable();
}

var relationshipsPromise = request.get(ws + '/entity/' + entityGid + '/relationships/').promise()
	.then(function(relationshipsResponse) {
		return relationshipsResponse.body;
	});

var relationshipTypesPromise = request.get(ws + '/relationshipType/').promise()
	.then(function(relationshipTypesResponse) {
		return relationshipTypesResponse.body;
	});

Promise.join(relationshipsPromise, relationshipTypesPromise,
	function(relationships, relationshipTypes) {
		ko.applyBindings(new RelationshipEditor(relationships, relationshipTypes));
	}).
catch(function(err) {
	console.log(err.stack);
});
