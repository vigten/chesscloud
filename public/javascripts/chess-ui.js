function chessUI() {
  var actualMoveIndex = 0;
  var view = 0; // usefull for the flip board function

  var defaultFEN = 'rnbqkbnr\/pppppppp\/8\/8\/8\/8\/PPPPPPPP\/RNBQKBNR w KQkq - 0 1', // fen loaded if no other valid fen is passed
  actualCoordinates = [], // the coordinates of actual move
  actualIsPromotion = false, // boolean, is true if this move is a promotion move
  actualPromotion = 0, // id of promotion piece
  enPassant = -1, // coordiantes of enpassant square
  zIndex = 50, // z-index property only for graphical effects
  pawnMoves = 0; // variable for the pawn move variables (for fen string)

  this.chess = new chess();
  this.restart = function () {
    var self = this;
    $('.pgn').html('');
    actualMoveIndex = 0;
    self.clarUnderlines();
    self.chess.restart();
    self.drawPiece();
    self.draggables();
  }
  //  draw the pieces acoording to position variable
  this.drawPiece = function () {
    var self = this;
    $('.piece').remove();
    for (var i = 0; i < 128; i++) {
      var piece = self.chess.position[i];
      if (piece != 0) {
        var firstId = ['w','b'][piece.color] + '_' + piece.type.charAt(0).toLowerCase();
        jQuery('<div/>',{
          'id': firstId + i,
          'class' : 'piece ' + piece.color + '_piece ' + firstId + '_piece',
          'css' : {
            'position' : 'absolute',
            'width' : '100%',
            'height': '100%',
            'left': '0px',
            'top': '0px'
          }
        }).data('coor',i).appendTo('#square' + i);
      }
    }
  };

  // toggle the visibility of non pawn piece. if argument is true or is not defined opacity is toggled, otherwise visibility
  this.showPawns = function (opacity) {
    if (typeof opacity == 'undefined' || opacity) {
      $(':not(.w_p_piece):not(.b_p_piece).piece').toggleClass('opacity');
    }
    else {
      $(':not(.w_p_piece):not(.b_p_piece).piece').toggle();
    }
  };

  this.parsePGN = function (pgnText) {

  };

  // show the position after the move at index moveIndex
  this.focusOn = function (moveIndex) {
    var self = this;

    //clear underline squares
    self.clarUnderlines();
    $(".active-move").removeClass('active-move');
    $('#move_' + moveIndex).addClass('active-move');
    if (moveIndex == 0) {
      self.chess.parseFEN(defaultFEN);
    }
    else {
      //take the coordinates of the move
      var start = self.chess.movesList[moveIndex].coor[0];
      var end = self.chess.movesList[moveIndex].coor[1];
      //parse the fen string associated to that move
      self.chess.parseFEN(self.chess.movesList[moveIndex].fen);
      //underline squares
      $('#square' + start).addClass('square_start');
      $('#square' + end).addClass('square_end');
    }
    $('.comment').html(self.chess.movesList[moveIndex].comment);
    actualMoveIndex = moveIndex;
    //draw the pieces
    self.drawPiece();
    //find the possible moves and let the pieces draggables
    self.chess.findLegalMoves();
    if (typeof viewMode == 'undefined') self.draggables();
      
  };
  
  //CHANGE VIEW
  this.changeView = function() {
    view = 1 - view;
    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 8; j++) {
        $('#square' + (16*i + j)).css({
          'left': (7*view-j*(2*view-1))*12.5 + '%',
          'top': (7*view-i*(2*view-1))*12.5 + '%'
        });
      }
    }
    // CHANGE LETTERS AND NUMBERS
    $('.letters').each(function () {
      var oldLeft = parseInt($(this)[0].style.left);
      $(this).css('left', (2*6 + 7*11 - oldLeft) + '%');
    });
    $('.numbers').each(function () {
      var oldTop = parseInt($(this)[0].style.top);
      $(this).css('top', (2*6 + 7*11 - oldTop) + '%');
    });
  };

  //DRAGGABLES
  this.draggables = function () {
    var self = this;
    $('.piece').draggable({
      containment: 'window',
      cursorAt: {left: $('#square0').width()/2, top: $('#square0').width()/2},
      start: function(event, ui) {
        actualCoordinates[0] = ui.helper.data('coor');
        zIndex ++;
        this.style.zIndex = zIndex;
        for (var k = 0; k < self.chess.legalMoves.length; k++) {
          if (self.chess.legalMoves[k][0] == ui.helper.data('coor')) {
            var colorX = self.chess.legalMoves[k][1]%16;
            var colorY = (self.chess.legalMoves[k][1]-colorX)/16;
            var color = (colorX + colorY)%2;
            $('#square' + self.chess.legalMoves[k][1]).addClass('squareTo_' + color);
          }
        }
      },
      stop: function(event, ui) {
        $('.squareTo_1').removeClass('squareTo_1');
        $('.squareTo_0').removeClass('squareTo_0');
      },
      revert: "invalid",
      revertDuration: 1
    });
  };



  this.enablePanel = function () {
    var color = $('#add-comment').css('color');
    $('.pgn-edit span').css({'cursor': 'pointer'}).hover(function () {
      $(this).css('color','#214478');
    }, function () {
      $(this).css('color',color);
    });

    var self = this;
    $('#icon-flip').click(function () {
      self.changeView();
    });
    $('#icon-cancel').click(function () {
      self.restart();
    });
    $('#icon-left').click(function () {
      if (actualMoveIndex > 1 ) self.focusOn(actualMoveIndex - 1);
    });
    $('#icon-right').click(function () {
      if (actualMoveIndex < self.chess.movesList.length) self.focusOn(actualMoveIndex + 1);
    });
    $('#add-symbol').click(function () {
      if (actualMoveIndex == 0) {
        // nothing
      }
      else {
        var old = $('#move_' + actualMoveIndex).text();
        $('#move_' + actualMoveIndex).text(old + '!!')
      }  
    });

    jQuery('<span>', {
      id : 'move_0',
      'class' : 'moveSpan active-move'
    }).html('<span class="glyphicon glyphicon-th"></span>').data('n',0).click(function () {self.focusOn($(this).data('n'));}).appendTo('.pgn');
    //$('.comment').hide();
    $('#add-comment').click(function () {
      setEndOfContenteditable($('.comment')[0]);
    });
    $('.comment').focusout(function () {
      self.chess.movesList[actualMoveIndex].comment = $('.comment').html();
      console.log(self.chess.movesList);
    });
  };

  this.showPromotion = function (piece) {
    var start = actualCoordinates[0];
    var end = actualCoordinates[1];
    var col = actualCoordinates[1]%16;
    var row = (actualCoordinates[1]-col)/16;
    $('#promotionDiv').css({
      'visibility': 'visible', 
      'left': piece.width()*(col + .5 - 4/3) + 'px',
      'top' : '-' + piece.width() + 'px'
    });
    var self = this;
    for (var i = 0; i < 4; i++) {
      var pieceDiv = $('#'+i);
      pieceDiv.css({
        'position': 'absolute',
        'width': '100%',
        'height': '100%',
        'left': '0px',
        'top': '0px'
      });
      pieceDiv.addClass(piece.attr('id').charAt(0) + '_' + ['q','r','n','b'][i] + '_piece piece');
      pieceDiv.off('click');
      pieceDiv.click(function() {
        $('#promotionDiv').css('visibility', 'hidden');
        piece.removeClass(piece.attr('id').charAt(0) + '_p_piece').addClass(piece.attr('id').charAt(0) + '_' + ['q','r','n','b'][this.id] + '_piece');
        actualIsPromotion = true;
        actualPromotion = this.id;

        var cp = self.chess.executeMove({coor:[start,end],isPromotion:true,promotion:this.id});
        pawnMoves = 0;
        var moveToPush = new move([start,end],actualIsPromotion,actualPromotion,self.getFEN());
        console.log(moveToPush);
        var otherMoves = self.chess.legalMoves;
        self.chess.findLegalMoves();
        var PGNmove = self.chess.move2PGN(start,end,(cp != 0),otherMoves);
        if (self.chess.turn == 1) {
          // PGNmove = (self.movesList.length + 1)/2  + '. ' + PGNmove;
          $('.pgn').append('<span class="moveNumber">' + (self.chess.movesList.length + 1)/2  + '.</span>');
        }
        jQuery('<span>', {
          id : 'move_' + self.movesList.length - 1,
          'class' : 'moveSpan'
        }).text(PGNmove).data('n',self.chess.movesList.length - 1).click(function () {self.focusOn($(this).data('n'));}).appendTo('.pgn');
        
        actualIsPromotion = false;
      });
    }
  };

  this.clarUnderlines = function () {
    $(".square_start").removeClass('square_start');
    $(".square_end").removeClass('square_end');
    $(".underline-bad-0").removeClass('underline-bad-0');
    $(".underline-bad-1").removeClass('underline-bad-1');
    $(".underline-good-0").removeClass('underline-good-0');
    $(".underline-good-1").removeClass('underline-good-1');
    $(".underline_0").removeClass('underline_0');
    $(".underline_1").removeClass('underline_1');
  }
  //DROPPABLES
  this.droppables = function () {
    var self = this;
    $('.square').droppable({
      tolerance: 'pointer',
      drop: function (event, ui) {
        var dragPiece = ui.draggable;
        var end = $('#' + this.id).data('coor');
        actualCoordinates[1] = end;
        if (array_belong(self.chess.legalMoves,actualCoordinates)) {
          
          var start = actualCoordinates[0],
          end = actualCoordinates[1],
          square = $('#square' + end),
          idToDel = null,
          pieceType = self.chess.position[start].type;

          //CLEAR classes
          self.clarUnderlines();
          $('.comment').html('');

          if (self.chess.position[end] != 0) $('#square' + end + ' div:visible').remove();
          if (pieceType == 'KING') {
            if (start == 116 && end == 118) {
              $('#square119 div').css({'left': '0px', 'top': '0px'}).data('coor',117).appendTo($('#square117'));
             }
             if (start == 116 && end == 114) {
               $('#square112 div').css({'left': '0px', 'top': '0px'}).data('coor',115).appendTo($('#square115'));
            }
            if (start == 4 && end == 6) {
               $('#square7 div').css({'left': '0px', 'top': '0px'}).data('coor',5).appendTo($('#square5'));
            }
            if (start == 4 && end == 2) {
              $('#square0 div').css({'left': '0px', 'top': '0px'}).data('coor',3).appendTo($('#square3'));
            }
          }
          if (pieceType == 'PAWN' && (Math.abs(start - end) == 15 || Math.abs(start - end) == 17) && self.chess.position[end] == 0) {
            var posToDel = (start > end) ? end + 16 : end - 16;
            $('#square' + posToDel + ' div:visible').remove();
          }
          dragPiece.css({'left' : '0px', 'top' : '0px'});
          dragPiece.data('coor',end);
          square[0].appendChild(dragPiece[0]);
          pawnMoves++;
          actualMoveIndex++;
          $('#square' + start).addClass('square_start');
          square.addClass('square_end');
          if (pieceType == 'PAWN' && (end < 8 || end > 111)) {
            self.showPromotion(dragPiece);
          }
          else {
            var cp = self.chess.executeMove({coor:actualCoordinates,isPromotion:actualIsPromotion,promotion:actualPromotion});
            if (cp != 0 || pieceType == 'PAWN') pawnMoves = 0;
            var moveToPush = new move([actualCoordinates[0],actualCoordinates[1]],actualIsPromotion,actualPromotion,self.chess.getFEN());
            console.log(moveToPush);
            self.chess.movesList.push(moveToPush);
            var otherMoves = self.legalMoves;
            self.chess.findLegalMoves();
            var PGNmove = self.chess.move2PGN(start,end,(cp != 0),otherMoves);
            if (self.chess.turn == 1) {
              $('.pgn').append('<span class="moveNumber">' + (self.chess.movesList.length )/2  + '.</span>');
            }
            jQuery('<span>', {
              id : 'move_' + (self.chess.movesList.length - 1),
              'class' : 'moveSpan'
            }).text(PGNmove + ' ').data('n',self.chess.movesList.length - 1).click(function () {self.focusOn($(this).data('n'));}).appendTo('.pgn');
          }
        }
        else {
          dragPiece.css({'left': '0px', 'top': '0px'}).appendTo('square' + actualCoordinates[0]);
        }
      }
    });
  };

  this.start = function (fen) {
    var self = this;
    self.chess.parseFEN(fen);
    self.drawPiece();
    self.chess.findLegalMoves();
    self.draggables();
    self.droppables();
    self.enablePanel();
  };
}

function setEndOfContenteditable(contentEditableElement) {
    var range,selection;
    if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
    {
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
    else if(document.selection)//IE 8 and lower
    { 
        range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
        range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        range.select();//Select the range (make it the visible selection
    }
}