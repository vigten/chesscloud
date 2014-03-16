function aspectResize () {
  var w = $('.boardMinWidth').width();
  $('.boardMinWidth').css('height',w + 'px');
  $('.numbers').css('line-height', w/8 + 'px');
  $('.letters').css('line-height', w*6/88 + 'px');
  var sqsize = $('#square0').width();
  $( '.piece').draggable( 'option', 'cursorAt', {left: sqsize/2, top: sqsize/2} );
  $('#right-container').css('height',$('#boardContainer').height());
//  $('.pgn').css('margin-top',0.06*$('#boardContainer').width());
  $('.comment').css('margin-bottom',0.06*$('#boardContainer').width());
  //$('#boardContainer').hide();
}
$(function () {
  aspectResize();
  for (var j = 0; j < 8; j++) {
    $('.l' + j).data('col',j).click(function () {underlineColumn($(this).data('col'));});
    $('.n' + j).data('row',j).click(function () {underlineRow($(this).data('row'));});
    for (var i = 0; i < 8; i++) {
      $('#square' + (16*j+i)).data('coor',16*j+i).bind("contextmenu", function (e) {
        var coor = $(this).data('coor');
        var i = coor%16;
        var j = (coor-i)/16;
        $(this).toggleClass('underline-bad-'+(i+j)%2);
        return false;
      }).click(function () {
        var coor = $(this).data('coor');
        var i = coor%16;
        var j = (coor-i)/16;
        $(this).toggleClass('underline-good-'+(i+j)%2);
      });
    }
  }
  var underlinedColumns = [];
  var underlinedRows = [];

  function underlineColumn(col) {
    var index = underlinedColumns.indexOf(col);
    if (index == -1) {
      underlinedColumns.push(col);
    }
    else {
      underlinedColumns.splice(index,1);
    }
    for (var k = 0; k < 8; k++) {
      if (underlinedRows.indexOf(k) != -1)  continue;
      $('#square' + (16*k+col)).toggleClass('underline_'+((col+k)%2));
    }
  }

  function underlineRow(row) {
    var index = underlinedRows.indexOf(row);
    if (index == -1) {
      underlinedRows.push(row);
    }
    else {
      underlinedRows.splice(index,1);
    }
    for (var k = 0; k < 8; k++) {
      if (underlinedColumns.indexOf(k) != -1)  continue;
      $('#square' + (16*row+k)).toggleClass('underline_'+((row+k)%2));
    }
  }

  $('#square0').click(function () {
    var color = ['blue','orange','grey','green'][Math.floor(4*Math.random())];
    $('#boardDiv').removeClass().addClass(color + '-schema');
  });
});