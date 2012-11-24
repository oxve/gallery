$(function() {
  var setSidebarMargins = function(){
    $('div.right > div').each(function(i, el) {
      if ($(el).is(':visible')) {
        var margin = $(el).height() / 5
        $(el).css({'margin-top': margin});
      }
    });
  };
  setSidebarMargins();
  $(window).resize(setSidebarMargins);

});
