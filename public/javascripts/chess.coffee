
# function to create an arbitrary length array of 0s
zeroArray = (len) -> 0 for i in [1..len]

# function to test if two arrays of numbers are equal
arrays_equal = (a,b) -> !(a < b or b < a)

# function to test if an element (array) belong to an array
array_belong = (array,element) ->
  for el in array
    if arrays_equal(el,element) 
      return true
  false

# function to convert from algebraic notation to an array of coordinates
alg2coor = (alg) ->
  column = 'abcdefgh'.split('').indexOf(alg.charAt(0))
  row = 8 - parseInt(alg.charAt(1))
  16*row + col

### 
function to validate a fen string
1. check if there are 6 elements: position, turn, castle,enpassant,pawnMoves,movesLength
2. check if pawnMoves >= 0 and movesLength > 0
3. check if turn is 'w' or 'b'
4. check the validity of enpassant
5. check the validity of castle
6. test position
  6.1. exactly 8 row
  6.2. no two consecutive numbers
  6.3. only rnbqkRNBQK characters in first and last rows
  6.4. only prnbqkRNBQK characters in others rows
  6.5. at max 8 pawns, 1 king and 16 piece for players
###
validate_FEN = (fen) ->
  fenArray = fen.split(/\s+/)
  if fenArray.length != 6 then return false
  if isNaN(fenArray[5]) or parseInt(fenArray[5], 10) <= 0 then return false
  if isNaN(fenArray[4]) or parseInt(fenArray[4], 10) < 0 then return false
  if !/^(w|b)$/.test(fenArray[1]) then return false
  if !/^(-|[abcdefgh][36])$/.test(fenArray[3]) then return false
  if !/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(fenArray[2]) then return false

  rows = fenArray[0].split("/")
  if rows.length != 8 then return false
  sum_pawns = [0,0]
  sum_kings = [0,0]
  sum_pieces = [0,0]
  for i in [0..7]
      sum_fields = 0
      previous_was_number = false

      for k in rows[i]
        if !isNaN(k)
          if previous_was_number then return false
          sum_fields += parseInt(k)
          previous_was_number = true
        else 
          if i == 0 or i == 7
            if !/^[rnbqkRNBQK]$/.test(k) then return false
            else if !/^[prnbqkPRNBQK]$/.test(k) then return false
            sum_fields += 1
            previous_was_number = false
            if k == k.toUpperCase() 
              sum_pieces[0]++
              if k == 'P' then sum_pawns[0]++
              if k == 'K' then sum_kings[0]++
            else 
              sum_pieces[1]++
              if (k == 'p') then sum_pawns[1]++
              if (k == 'k') then sum_kings[1]++
    if sum_fields != 8 then return false
  if sum_pawns[0] > 8 or 
    sum_pawns[1] > 8 or
    sum_kings[0] != 1 or 
    sum_kings[1] != 1 or
    sum_pieces[0] > 16 or
    sum_pieces[1] > 16
    then false
    true

###
class Move to extend in the future
###
class Move

  constructor: (@coor,@isPromotion,@promotion,@fen) ->

###
class Piece.
  variable: color,type
  methods:
    setType to change type (promotion)
    getFEN to get the character of the piece in the fenstring
###
class Piece

  constructor: (@color,@type) ->
  @setType = (newType) -> @type = type
  @getFEN = ->
    fenChear = @type.charAt(0)
    if @color 
      fenChar = fenChar.toLowerCase()
    fenChar

###
class chess.
  public variables:
    movesList is the list of moves
    kingsPosition is an array with the positions of the kings (usefull for test the checks)
    position is the board
    castles is an arrray with the avaiblity of castling
    legalMoves is an array of the coordinates of the possible moves
    turn is 0 if it's white turn or 1 if it's black turn
  private variables:
    defaultFEN is a string with the startpos
    actualCoordinates is an array with the coordinates of the current move
    actualIsPromotion is a booleane set to true is is a promotion move
    actualPromotion is the id of the piece to wich promove
    enPassant is coordinate of enpassant square
    zIndex is an integer to enshure that the piece dragged is over the others
    pawnMoves is the number of consecutive moves of non pawn piece
###
class chess

  @movesList = []
  @kingsPosition = [116, 4]
  @position = zeroArray(128)
  @castles = [[true,true],[true,true]]
  @legalMoves = []
  @turn = 0

  defaultFEN = 'rnbqkbnr\/pppppppp\/8\/8\/8\/8\/PPPPPPPP\/RNBQKBNR w KQkq - 0 1'
  actualCoordinates = []
  actualIsPromotion = false
  actualPromotion = 0
  enPassant = -1
  zIndex = 50
  pawnMoves = 0

  @restart = ->
    @parseFEN(defaultFEN)
    @movesList = []
    @findLegalMoves()

  @parseFEN = (fen) ->
    @position = zeroArray(128)
    if !validate_FEN(fen) then fen = defaultFEN
    fenObj = _.object(['position', 'turn', 'castle','enpassant','pawnMoves','movesLength'],fen.split(' '))
    actualIndex = 0
    for ch in fenObj.position
        if !isNaN(ch) then actualIndex += parseInt(ch)
        else
          if ch == '\/' then actualIndex += 8
          else 
            color = if ch == ch.toLowerCase() then 1 else 
            pieceType = _.find(['PAWN','ROOK','NIGHT','BISHOP','QUEEN','KING'], (str) -> str.charAt(0) == ch.toUpperCase());
            @position[actualIndex] = new Piece(color,pieceType)
            if ch == 'k' then @kingsPosition[1] = actualIndex
            if ch == 'K' then @kingsPosition[0] = actualIndex
            actualIndex++
    @turn = if fenObj.turn == 'w' then 0 else 1
    @castles = [[false,false],[false,false]]
    for ch in fenObj.castle
      if ch == '-' then break
      row = if ch == ch.toLowerCase() then 1 else 0
      col = if ch.toLowerCase() == 'k' then 1 else 0
      @castles[row][col] = true
    if fenObj.enpassant != '-' then enPassant = alg2coor(fenObj.enpassant)
    pawnMoves = parseInt(fenObj.pawnMoves)

  @getFEN = () ->
    fen = ''
    for row in [0..7]
      zeroCount = 0
      for col in [0..7]
        pos = 16*row + col
        piece = @position[pos]
        if piece == 0 then zeroCount++
        else if zeroCount > 0
          fen += zeroCount + piece.getFEN()
          zeroCount = 0
        else fen += piece.getFEN()
        if zeroCount != 0 then fen += zeroCount
        if row != 7 then fen += "\/"
    fen = fen + ' ' + ['w','b'][@turn] + ' '
    castleAvaible = false
    for i in [0..1]
      for j in [0..1]
        if @castles[i][1-j]
          castleAvaible = true
          fen += [['Q','K'],['q','k']][i][1-j]
    if !castleAvaible then fen += '-'
    fen += ' '
    if enPassant != -1 then fen += coor2alg(enPassant) else fen += '-'        
    fen += ' ' + pawnMoves
    fen += ' ' + Math.floor(@movesList.length/2 + 1)
    fen

  @executeMove = (move) ->
    from = move.coor[0]
    to = move.coor[1]
    piece = @position[from]
    capturedPiece = @position[to]
    @position[to] = piece
    @position[from] = 0
    switch piece.type
      when 'PAWN'
        diff = Math.abs(from - to)
        if diff == 32
          enPassant = if from > to then to + 16 else to - 16
        else if (diff == 15 or diff == 17) and !capturedPiece
          capturedPosition = if from > to then to + 16 else to - 16
          capturedPiece = @position[capturedPosition]
          @position[capturedPosition] = 0
      when 'KING'
        @kingsPosition[@turn] = to
        @castles[@turn] = [false,false]
        if Math.abs(from - to) == 2
          rookTo = from + if from > to then -1 else 1
          rookFrom = from + if from > to then -4 else 3
          @position[rookTo] = @position[rookFrom]
          @position[rookFrom] = 0
       when 'ROOK'
        if @turn == 1
          if from == 0 then @castles[1][0] = false
          else if from == 7 then @castles[1][1] = false
        else if @turn == 0
          if from == 112 then @castles[0][0] = false
          else if from == 119 then @castles[0][1] = false

    if move.isPromotion then @position[to].type = ['QUEEN','ROOK','NIGHT','BISHOP'][move.promotion]
    @turn = 1 - @turn
    capturedPiece

  @isChecked = (player) ->
    self = @
    bdir = [-15,15,-17,17]
    rdir = [-1,1,-16,16]
    ndir = [-14,14,-18,18,-31,31,-33,33]
    i = self.kingsPosition[player]
    for k in bdir
      onBoard = _.filter(_.map(_.range(1,8), (num) -> i + num*k), (num) ->  !(num & 0x88))
      occupied = _.find(onBoard, (num) -> self.position[num] != 0)
      if !_.isUndefined(occupied) and self.position[occupied].color == 1 - player and ['QUEEN','BISHOP'].indexOf(self.position[occupied].type) != -1 then return true
    for k in rdir
      onBoard = _.filter(_.map(_.range(1,8), (num) -> i + num*k), (num) -> !(num & 0x88))
      occupied = _.find(onBoard, (num) -> self.position[num] != 0)
      if !_.isUndefined(occupied) and 
        self.position[occupied].color == 1 - player and 
        ['QUEEN','ROOK'].indexOf(self.position[occupied].type) != -1 
        then return true
    for k in ndir
      if !((i + k) & 0x88) and 
        self.position[i + k].color == 1 - player and 
        self.position[i + k].type == 'NIGHT'
        then return true
    if player == 0 
      if !((i - 15) & 0x88) and 
        self.position[i - 15].type == 'PAWN' and 
        self.position[i - 15].color == 1 
        then return true
      if !((i - 17) & 0x88) and 
        self.position[i - 17].type == 'PAWN' and 
        self.position[i - 17].color == 1 
        then return true
    if (player == 1)
      if !((i + 15) & 0x88) and 
        self.position[i + 15].type == 'PAWN' and 
        self.position[i + 15].color == 0 
        then return true
      if !((i + 17) & 0x88) and 
        self.position[i + 17].type == 'PAWN' and 
        self.position[i + 17].color == 0 
        then return true
    false

  @isCheckMate = ->  @isChecked(@turn) and @legalMoves.length == 0

  @isStaleMate = -> !@isChecked(@turn) and @legalMoves.length == 0

  @findLegalMoves = ->
    bdir = [-15,15,-17,17]
    rdir = [-1,1,-16,16]
    ndir = [-14,14,-18,18,-31,31,-33,33]
    kdir = [-1,1,-16,16,-15,15,-17,17]
    s = 1
    piece = -1
    movesTemp = []
    @legalMoves = []
    for i in [0..127]
      piece = @position[i]
      if piece.color != @turn then continue
      else
        switch piece.type
          when 'PAWN'
            if @turn == 0
              if !@position[i - 16]
                movesTemp.push([i,i - 16])
                if (i & 0x70) == 0x60 and !@position[i - 32] then movesTemp.push([i,i - 32])
              if !((i - 15) & 0x88) and @position[i - 15] and @position[i - 15].color != @turn then movesTemp.push([i,i - 15])
              if !((i - 17) & 0x88) and @position[i - 17] and @position[i - 17].color != @turn then movesTemp.push([i,i - 17])
            else 
              if !@position[i + 16]
                movesTemp.push([i,i + 16])
                if (i & 0x70) == 0x10 and !@position[i + 32] then movesTemp.push([i,i + 32])
              if !((i + 15) & 0x88) and @position[i + 15] and @position[i + 15].color != @turn then movesTemp.push([i,i + 15])
              if !((i + 17) & 0x88) and @position[i + 17] and @position[i + 17].color != @turn then movesTemp.push([i,i + 17])
          when 'NIGHT'
            for k in ndir
              if !((i + k) & 0x88) and (@position[i + ndir[k]] == 0 or @position[i + k].color != @turn ) then movesTemp.push([i,i+k])
          when 'BISHOP'
            for k in bdir
              step = 1
              while !(((i + step*k) & 0x88)) and !@position[i + step*k]
                movesTemp.push([i,i+step*k])
                step++
              if !(((i + step*k) & 0x88)) and 
                @position[i + step*k].color != @turn
                then movesTemp.push([i,i+step*k])
          when 'ROOK'
            for k in rdir
              step = 1
              while !(((i + step*k) & 0x88)) and !@position[i + step*k] 
                movesTemp.push([i,i+step*k])
                step++
              if !(((i + step*k) & 0x88)) and 
                @position[i + step*k].color != @turn
                then movesTemp.push([i,i+step*k])
          when 'QUEEN'
            for k in kdir
              step = 1
              while !(((i + step*kdir[k]) & 0x88)) and !@position[i + step*kdir[k]]
                movesTemp.push([i,i+step*kdir[k]])
                step++
              if !(((i + step*kdir[k]) & 0x88)) and 
                @position[i + step*kdir[k]].color != @turn
                then movesTemp.push([i,i+step*kdir[k]])
          when 'KING'
            for k in kdir
              if !(((i + k) & 0x88)) and 
                (!@position[i + k] or @position[i + k].color != @turn)
                then movesTemp.push([i,i+k])
    if enPassant != -1
      for i in [0..1]
        posToCheck = enPassant + (if @turn == 0 then 16 else -16) + Math.pow(-1,i)
        if !(posToCheck & 0x88) and 
          @position[posToCheck] != 0  and 
          @position[posToCheck].color == @turn and  
          @position[posToCheck].type == 'PAWN'
          then movesTemp.push([posToCheck,enPassant])

    @legalMoves = movesTemp.filter (move) ->
      castlesTemp = [[0,0],[0,0]]
      turnTemp = @turn
      positionTemp = []
      kingsTemp = []
      for i in @position
        positionTemp.push(i)
      for i in @kingsPosition
        kingsTemp.push(i)
      for i in [0..1]
        for j in [0..1]
          castlesTemp[i][j] = @castles[i][j]
      @executeMove({'coor': move, 'type': 0, 'promotion': 0})
      result = if !@isChecked(1-@turn) then true else false
      for i in [0..128]
        @position[i] = positionTemp[i]
      for i in [0..1]
        @kingsPosition[i] = kingsTemp[i]
        for j in [0..1]
          @castles[i][j] = castlesTemp[i][j]
      @turn = turnTemp
      result
      
    movesTemp = []
    if @turn == 0 and 
      @castles[0][1] and 
      !@position[7*16+5] and 
      !@position[7*16+6] and 
      array_belong(@legalMoves,[7*16 + 4,7*16 + 5])
      then movesTemp.push([7*16 + 4,7*16 + 6])
    if @turn == 0 and 
      @castles[0][0] and 
      !@position[7*16+1] and 
      !@position[7*16+2] and 
      !@position[7*16+3] and 
      array_belong(@legalMoves,[7*16 + 4,7*16 + 3])
      then movesTemp.push([7*16 + 4,7*16 + 2])
    if @turn == 1 and 
      @castles[1][1] and 
      !@position[5] and 
      !@position[6] and 
      array_belong(@legalMoves,[4,5]) 
      then movesTemp.push([4,6])
    if @turn == 1 and 
      @castles[1][0] and 
      !@position[1] and 
      !@position[2] and 
      !@position[3] and 
      array_belong(@legalMoves,[4,3]) 
      then movesTemp.push([4,2])
    castleMoves = movesTemp.filter (move) ->
      castlesTemp = [[0,0],[0,0]]
      turnTemp = @turn
      positionTemp = []
      kingsTemp = []
      for i in @position
        positionTemp.push(i)
      for i in @kingsPosition
        kingsTemp.push(i)
      for i in [0..1]
        for j in [0..1]
          castlesTemp[i][j] = @castles[i][j]
      @executeMove({'coor': move, 'type': 0, 'promotion': 0})
      result = if !@isChecked(1-@turn) then true else false
      for i in [0..128]
        @position[i] = positionTemp[i]
      for i in [0..1]
        @kingsPosition[i] = kingsTemp[i]
        for j in [0..1]
          @castles[i][j] = castlesTemp[i][j]
      @turn = turnTemp
      result
    enPassant = -1;
    Array::push.apply @legalMoves, castleMoves
    true

  @move2PGN = (start,end,capturing,otherMoves) ->
    self = @
    piece = self.position[end]
    moveString = ''
    endString = coor2alg(end)

    if piece.type != 'PAWN' and !actualIsPromotion then moveString += piece.type.charAt(0)
    else if Math.abs(start - end) == 15 or Math.abs(start - end) == 17 
      moveString += coor2alg(start).charAt(0)
    others = _.map(_.filter(otherMoves, (move) -> move[1] == end and move[0] != start and self.position[move[0]].type == piece.type), (move) -> move[0])    
    uniqueCol = true
    for o in others
      if (o - start)%16 == 0 
        uniqueCol = false
        break
    uniqueRow = true
    if !uniqueCol 
      for o in others
        if (start-(start%16))/16 == (o-(o%16))/16
          uniqueRow = false
          break
    if piece.type == 'PAWN'
      uniqueRow = true
      uniqueCol = true
    if others.length > 0
      if uniqueCol then moveString += coor2alg(start).charAt(0)
      else if uniqueRow moveString += coor2alg(start).charAt(1)
      else moveString += coor2alg(start)            
    if capturing then moveString += 'x'
    moveString += endString
    if piece.type == 'KING'
      if end - start == 2 then moveString = 'O-O'
      if end - start == -2 then moveString = 'O-O-O'
    if actualIsPromotion then moveString += '=' + 'QRNB'.charAt(actualPromotion)
    if self.isChecked(self.turn)
      if self.isCheckMate() then moveString += '#'
      else moveString += '+'
    moveString

  @pgn2move = (pgn) ->
    fen = ''
    self = @
    pgn = pgn.replace('+','').replace('#','').replace('x','')
    if pgn == 'O-O'
      if self.turn == 0 then _coor = [7*16 + 4,7*16 + 6]
      if self.turn == 1 then _coor = [4,6]
    else if pgn == 'O-O-O'
      if self.turn == 0 then _coor = [7*16 + 4,7*16 + 2]
      if self.turn == 1 then _coor = [4,2]
    else
      splittedPgn = pgn.split('=')
      if splittedPgn.length == 2
        _isPromo = true
        _promo = ['Q','R','N','B'].indexOf(splittedPgn[1])
      pgn = splittedPgn[0]
      endSquare = alg2coor(pgn.slice(pgn.length-2,pgn.length))
      startString = pgn.slice(0,pgn.length-2)
      if startString.length > 0 and startString.charAt(0) == startString.charAt(0).toUpperCase() then t = startString.charAt(0)
      else 
        startString = 'P' + startString
        t = 'P'
      filteredMoves = _.filter(self.legalMoves, (coor) -> coor[1] == endSquare and self.position[coor[0]].type.charAt(0) == t)
      if filteredMoves.length == 1 then _coor = filteredMoves[0]
      else if filteredMoves.length == 2
        col = ['a','b','c','d','e','f','g','h'].indexOf(startString.charAt(1))
        if col != -1 then filteredMoves = _.filter(filteredMoves, (coor) -> (coor[0] - col) % 16 == 0)
        else filteredMoves = _.filter(filteredMoves, (coor) -> Math.abs(coor[0] - parseInt(startString.charAt(1))) <= 7)
      else if filteredMoves.length == 3
        col = ['a','b','c','d','e','f','g','h'].indexOf(startString.charAt(1))
        row = parseInt(startString.charAt(1))
        filteredMoves = _.filter(filteredMoves, (coor) -> Math.abs(coor[0] - row) <= 7 and (coor[0] - col) % 16 == 0)          _coor = filteredMoves[0]
      _coor = filteredMoves[0]
    new Move(_coor,_isPromo,_promo,_fen)
