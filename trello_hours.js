(function() {
  var boardId = _.last(location.href.split('/'));

  /**
   * If a card starts with a string like "[4]", this method returns the
   * first number in the brackets. Otherwise it returns zero.
   */
  var hoursFor = function(card) {
    var matches = /^\[{1,2}(.*)\]{1,2}/.exec(card.name);
    var hours   = parseFloat(_.isEmpty(matches) ? '' : matches[1]);
    return ((hours > 0) ? hours : 0)
  };

  /**
   * Returns a list of categories a card should be counted towards. At
   * minimum, always returns the category 'total', so all cards count
   * towards the total.
   */
  var categoriesFor = function(card) {
    var labelMap = { green: 'done', yellow: 'done', orange: 'done' };

    return _(card.labels).chain()
      .map(function(label) { return labelMap[label.color]; })
      .uniq().compact().value().concat(['total']);
  };

  $.ajax({
    url: 'https://trello.com/1/boards/' + boardId,
    data: { lists: 'all', cards: 'all' },
    context: document.body,
    success: function(data) {
      /**
       * Since marking a list as closed doesn't mark its member cards,
       * we have to go through the boring task of finding which lists
       * are closed to find out whether a card is ignorable.
       */
      var isOpen = function(obj) { return !obj.closed; };
      var openListIds  = _(data.lists).chain()
        .filter(isOpen).pluck('id').value();

      var summedStats = _(data.cards).chain()
        .filter(function(card) { // open cards in open lists
          return isOpen(card) && _(openListIds).include(card.idList);
        }).reduce(function(stats, card) {
          var hoursSpent = hoursFor(card);
          _(categoriesFor(card)).each(function(category) {
            var categoryHours = stats[category] || 0;
            stats[category] = categoryHours + hoursSpent;
          });

          return stats;
        }, {}).value();

      var message = "Sprint statistics:\n\n"
      _(summedStats).each(function(hours, category) {
        message += "\t" + category.toUpperCase() + "\n\t\t" + hours + "\n\n";
      });

      alert(message);
    }
  });
})();
