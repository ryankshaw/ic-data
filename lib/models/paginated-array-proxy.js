import { ArrayProxy, RSVP } from 'ember';

var PaginatedArrayProxy = ArrayProxy.extend({

  files: Ember.computed.alias('folder.files'),
  folders: Ember.computed.alias('folder.folders'),
  files_count: Ember.computed.alias('folder.files_count'),
  folders_count: Ember.computed.alias('folder.folders_count'),
  sortParam: 'name',
  sortAscending: true,
  folder: null,

  content:function(){
    if(this.get('folders.isFulfilled') && this.get('files.isFulfilled')){
      return this.get('folders').toArray().concat(this.get('files').toArray())
    }
    return [];
  }.property('folders.[]', 'files.[]'),

  getNextPage: function(){
    var filesPromise = null;
    var foldersPromise = null;

    if (!this.get('areAllFilesLoaded')){
      filesPromise = this.get('files').then(function(files){
        return files.getNextPage();
      });
    }

    if (!this.get('areAllFoldersLoaded')){
      foldersPromise = this.get('folders').then(function(folders){
        return folders.getNextPage();
      });
    }

    return RSVP.all([filesPromise, foldersPromise]);
  },

  areAllFilesLoaded: function(){
    return this.get('files.length') == this.get('files_count');
  }.property('files.length', 'files_count'),

  areAllFoldersLoaded: function(){
    return this.get('folders.length') == this.get('folders_count');
  }.property('folders.length', 'folders_count'),

  isEverythingLoaded: Ember.computed.and('areAllFoldersLoaded', 'areAllFilesLoaded'),

  // tells me to sort by the given column name, sortAscending is optional
  setSort: function(column, sortAscending){
    if (sortAscending == null) {
      sortAscending = this.get('sortParam') !== column;
    }
    this.setProperties({
      sortParam: column,
      sortAscending: !!sortAscending
    });
    if (this.get('isEverythingLoaded')) return Ember.RSVP.resolve();

    // TODO: It would be better to do this in a way that doesn't assume we
    // need to have 'include[]=user' and keeps other query string params around
    var queryParams = '?include[]=user&sort=' + column + '&order=' + (this.get('sortAscending') ? 'asc' : 'desc');

    var folder = this.get('folder')
    return RSVP.all(['files', 'folders'].map(function(type){
      url = new URL(folder.get('data.links.' + type));
      url.search = queryParams;
      folder.set('data.links.' + type, url.toString());
      folder._relationships[type] = null;
      folder.notifyPropertyChange(type);
      return folder.get(type);
    }));
  }

});


export default PaginatedArrayProxy;