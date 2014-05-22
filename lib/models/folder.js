import { Model, attr, hasMany, belongsTo } from 'ember-data';
import { ArrayProxy } from 'ember';

var Folder = Model.extend({

  parentFolder: belongsTo('folder', {async:true, inverse:'folders'}),

  folders: hasMany('folder', { async:true, inverse: 'parentFolder' }),

  files: hasMany('file', { async: true }),

  children: function(){
    var _this = this,
        children = Ember.ArrayProxy.create({content:[]});

    ['folders', 'files'].forEach(function(type){
      if (_this.get(type + '_count') !== 0) {
        _this.get(type).then(children.addObjects.bind(children));
      }
    });
    return children;
  }.property('folders', 'files'),

  context_type: attr('string'),

  context_id: attr('number'),

  files_count: attr('number'),

  position: attr('number'),

  folders_url: attr('string'),

  files_url: attr('string'),

  full_name: attr('string'),

  folders_count: attr('number'),

  name: attr('string'),

  created_at: attr('date'),

  updated_at: attr('date'),

  lock_at: attr('date'),

  unlock_at: attr('date'),

  hidden: attr('boolean'),

  hidden_for_user: attr('boolean'),

  locked: attr('boolean'),

  locked_for_user: attr('boolean')

});

export default Folder;

