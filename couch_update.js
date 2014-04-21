var couchapp = require('couchapp'),
    ddocs;

ddoc = {
  _id: '_design/news',
  views: {},
  language: 'javascript',
};

ddoc.views.all_news = {
  map: function (doc) {
    if (doc.type !== 'Photo') return;
    emit(doc.id, null);
  }
}

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {
  if (!userCtx.name)
    throw({'unauthorized': 'You must be logged in to create a new post.'});

  if (newDoc._deleted !== true && newDoc.type === 'Photo' && newDoc.title.trim().length < 4)
    throw('forbidden', 'You must enter a title longer than 4 characters.');
};

module.exports = ddoc;
