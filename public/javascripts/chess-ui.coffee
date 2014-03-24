class chessUI

  actualMoveIndex = 0
  view = 0 # usefull for the flip board function
  defaultFEN = 'rnbqkbnr\/pppppppp\/8\/8\/8\/8\/PPPPPPPP\/RNBQKBNR w KQkq - 0 1' # fen loaded if no other valid fen is passed
  actualCoordinates = [] # the coordinates of actual move
  actualIsPromotion = false # boolean, is true if @ move is a promotion move
  actualPromotion = 0 # id of promotion piece
  enPassant = -1 # coordiantes of enpassant square
  zIndex = 50 # z-index property only for graphical effects
  pawnMoves = 0 # variable for the pawn move variables (for fen string)

  @chess = new chess
  @restart = ->
    self = @
    $('#pgn-container').html('')
    actualMoveIndex = 0
    self.clarUnderlines()
    self.chess.restart()
    self.drawPiece()
    self.draggables()
    this

  @drawPiece = ->
    self = @
    $('.piece').remove()
    for i in [0..127]
      piece = self.chess.position[i]
      if piece != 0
        firstId = ['w','b'][piece.color] + '_' + piece.type.charAt(0).toLowerCase()
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
        }).data('coor',i).appendTo('#square' + i)
    this
  
  @showPawns = (opacity) ->
    if  typeof opacity == 'undefined' || opacity
      $(':not(.w_p_piece):not(.b_p_piece).piece').toggleClass('opacity')
    else 
      $(':not(.w_p_piece):not(.b_p_piece).piece').toggle()
    this

  @focusOn = (moveIndex) ->
    self = @
    #clear underline squares
    self.clarUnderlines()
    $(".active-move").removeClass('active-move')
    $('#move_' + moveIndex).addClass('active-move')
    if moveIndex == 0
      self.chess.parseFEN(defaultFEN)
    else
      #take the coordinates of the move
      start = self.chess.movesList[moveIndex].coor[0]
      end = self.chess.movesList[moveIndex].coor[1]
      #parse the fen string associated to that move
      self.chess.parseFEN(self.chess.movesList[moveIndex].fen)
      #underline squares
      $('#square' + start).addClass('square_start')
      $('#square' + end).addClass('square_end')
    $('.comment').html(self.chess.movesList[moveIndex].comment)
    actualMoveIndex = moveIndex
    #draw the pieces
    self.drawPiece()
    #find the possible moves and let the pieces draggables
    self.chess.findLegalMoves()
    if typeof viewMode == 'undefined'
      self.draggables()
    this
  
  #CHANGE VIEW
  @changeView = () ->
    view = 1 - view
    for i in [0..7]
      for j in [0..7]
        $('#square' + (16*i + j)).css({
          'left': (7*view-j*(2*view-1))*12.5 + '%',
          'top': (7*view-i*(2*view-1))*12.5 + '%'
        })
    # CHANGE LETTERS AND NUMBERS
    $('.letters').each( () ->
      oldLeft = parseInt($(@)[0].style.left)
      $(@).css('left', (2*6 + 7*11 - oldLeft) + '%')
    )
    $('.numbers').each( () ->
      oldTop = parseInt($(@)[0].style.top)
      $(@).css('top', (2*6 + 7*11 - oldTop) + '%')
    )
    this

  #DRAGGABLES
  @draggables = () ->
    self = @
    $('.piece').draggable({
      containment: 'window',
      cursorAt: {left: $('#square0').width()/2, top: $('#square0').width()/2},
      start: (event, ui) ->
        actualCoordinates[0] = ui.helper.data('coor')
        zIndex++
        @style.zIndex = zIndex
        for move in self.chess.legalMoves
          if move[0] == ui.helper.data('coor')
            colorX = self.chess.legalMoves[k][1]%16
            colorY = (self.chess.legalMoves[k][1]-colorX)/16
            color = (colorX + colorY)%2
            $('#square' + self.chess.legalMoves[k][1]).addClass('squareTo_' + color)
      ,
      stop: (event, ui) ->
        $('.squareTo_1').removeClass('squareTo_1')
        $('.squareTo_0').removeClass('squareTo_0')
      ,
      revert: "invalid",
      revertDuration: 1
    })
    this


  @clarUnderlines =  () ->
    $(".square_start").removeClass('square_start')
    $(".square_end").removeClass('square_end')
    $(".underline-bad-0").removeClass('underline-bad-0')
    $(".underline-bad-1").removeClass('underline-bad-1')
    $(".underline-good-0").removeClass('underline-good-0')
    $(".underline-good-1").removeClass('underline-good-1')
    $(".underline_0").removeClass('underline_0')
    $(".underline_1").removeClass('underline_1')
    this

  #DROPPABLES
  @droppables =  () ->
    self = @
    $('.square').droppable({
      tolerance: 'pointer',
      drop: (event, ui) ->
        dragPiece = ui.draggable
        end = $('#' + @id).data('coor')
        actualCoordinates[1] = end
        if array_belong(self.chess.legalMoves,actualCoordinates)
          start = actualCoordinates[0]
          end = actualCoordinates[1]
          square = $('#square' + end)
          idToDel = null
          pieceType = self.chess.position[start].type

          #CLEAR classes
          self.clarUnderlines()
          $('#comments-container').html('')

          if self.chess.position[end] != 0
            $('#square' + end + ' div:visible').remove()
          if pieceType == 'KING'
            if start == 116 && end == 118
              $('#square119 div').css({'left': '0px', 'top': '0px'}).data('coor',117).appendTo($('#square117'))
            if start == 116 && end == 114
              $('#square112 div').css({'left': '0px', 'top': '0px'}).data('coor',115).appendTo($('#square115'))
            if start == 4 && end == 6
              $('#square7 div').css({'left': '0px', 'top': '0px'}).data('coor',5).appendTo($('#square5'))
            if start == 4 && end == 2
              $('#square0 div').css({'left': '0px', 'top': '0px'}).data('coor',3).appendTo($('#square3'))
          if pieceType == 'PAWN' && (Math.abs(start - end) == 15 || Math.abs(start - end) == 17) && self.chess.position[end] == 0
            posToDel = (start > end) ? end + 16 : end - 16
            $('#square' + posToDel + ' div:visible').remove()
          dragPiece.css({'left' : '0px', 'top' : '0px'})
          dragPiece.data('coor',end)
          square[0].appendChild(dragPiece[0])
          pawnMoves++
          actualMoveIndex++
          $('#square' + start).addClass('square_start')
          square.addClass('square_end')
          if pieceType == 'PAWN' && (end < 8 || end > 111)
            self.showPromotion(dragPiece)
          else
            cp = self.chess.executeMove({coor:actualCoordinates,isPromotion:actualIsPromotion,promotion:actualPromotion})
            if cp != 0 || pieceType == 'PAWN'
              pawnMoves = 0
            moveToPush = new move([actualCoordinates[0],actualCoordinates[1]],actualIsPromotion,actualPromotion,self.chess.getFEN())
            self.chess.movesList.push(moveToPush)
            otherMoves = self.legalMoves
            self.chess.findLegalMoves()
            PGNmove = self.chess.move2PGN(start,end,(cp != 0),otherMoves)
            if self.chess.turn == 1
              $('.pgn').append('<span class="moveNumber">' + (self.chess.movesList.length )/2  + '.</span>')
            jQuery('<span>', {
              id : 'move_' + (self.chess.movesList.length - 1),
              'class' : 'moveSpan'
            }).text(PGNmove + ' ').data('n',self.chess.movesList.length - 1).click(() -> self.focusOn($(@).data('n'))).appendTo('.pgn')
        else 
          dragPiece.css({'left': '0px', 'top': '0px'}).appendTo('square' + actualCoordinates[0])
    })
    this


  @start = (fen) ->
    self = @
    self.chess.parseFEN(fen)
    self.drawPiece()
    self.chess.findLegalMoves()
    self.draggables()
    self.droppables()
    this
