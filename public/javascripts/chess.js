function zeroArray(len) {
    var rv = new Array(len);
    while (--len >= 0) {
        rv[len] = 0;
    }
    return rv;
}

function arrays_equal(a,b) {
    return !(a < b || b < a);
}

function array_belong(array,elem) {
    for (var i = 0; i < array.length; i++) {
        if (arrays_equal(elem,array[i])) {
            return true;
        }
    }
    return false;
}

function alg2coor(alg) {
    var col = 'abcdefgh'.split('').indexOf(alg.charAt(0));
    var row = 8 - parseInt(alg.charAt(1));
    return 16*row + col;
}

function coor2alg(coor) {
    var col = coor%16;
    var row = 8 - (coor-col)/16;
    return 'abcdefgh'.charAt(col) + row;
}

// check if a fen string is valid 
// TODO: add check control!
function validate_FEN(fen) {

    fenArray = fen.split(/\s+/);

    if (fenArray.length != 6) return false;
    if (isNaN(fenArray[5]) || (parseInt(fenArray[5], 10) <= 0)) return false;
    if (isNaN(fenArray[4]) || (parseInt(fenArray[4], 10) < 0)) return false;
    if (!/^(w|b)$/.test(fenArray[1])) return false;
    if (!/^(-|[abcdefgh][36])$/.test(fenArray[3])) return false;
    if( !/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(fenArray[2])) return false;

    var rows = fenArray[0].split("/");
    if (rows.length != 8) return false;
    var sum_pawns = [0,0];
    var sum_kings = [0,0];
    var sum_pieces = [0,0];
    for (var i = 0; i < 8; i++) {
      var sum_fields = 0;
      var previous_was_number = false;

      for (var k = 0; k < rows[i].length; k++) {
        if (!isNaN(rows[i][k])) {
          if (previous_was_number) {
            return false;
          }
          sum_fields += parseInt(rows[i][k]);
          previous_was_number = true;
        } 
        else {
            if (i == 0 || i == 7) {
                if (!/^[rnbqkRNBQK]$/.test(rows[i][k])) return false;
            }
            else {
                if (!/^[prnbqkPRNBQK]$/.test(rows[i][k])) return false;
            }
            sum_fields += 1;
            previous_was_number = false;
            if (rows[i][k] == rows[i][k].toUpperCase()) {
                sum_pieces[0]++;
                if (rows[i][k] == 'P') sum_pawns[0]++;
                if (rows[i][k] == 'K') sum_kings[0]++;
            }
            else {
                sum_pieces[1]++;
                if (rows[i][k] == 'p') sum_pawns[1]++;
                if (rows[i][k] == 'k') sum_kings[1]++;
            }
        }
      }
      if (sum_fields != 8) return false;
    }
    if (
        sum_pawns[0] > 8 || sum_pawns[1] > 8 || 
        sum_kings[0] != 1 || sum_kings[1] != 1 || 
        sum_pieces[0] > 16 || sum_pieces[1] > 16
        ) return false;
    return true;
}

function move (coordinates,isPromotion,promotion,fen) {
    this.coor = coordinates;
    this.isPromotion = isPromotion;
    this.promotion = promotion;
    this.fen = fen;
    this.comment = '';
}

function chess () {

    // public variables
    this.movesList = [new move([-1,-1],false,0,defaultFEN)]; // the moves list
    this.kingsPosition = [116, 4]; // the positions of the kings, usefull to verify if a king is checked
    this.position = zeroArray(128); // initialize positions array with 0 array of dimension 128
    this.castles = [[true,true],[true,true]]; // avaiblity of calstles [[white 0-0-0, white 0-0],[black 0-0-0, black 0-0]]
    this.legalMoves = []; // the legal moves in a specific moment. updated after every move
    this.turn = 0; // the turn, initialized whit 0 -> white

    // private variables
    var defaultFEN = 'rnbqkbnr\/pppppppp\/8\/8\/8\/8\/PPPPPPPP\/RNBQKBNR w KQkq - 0 1', // fen loaded if no other valid fen is passed
        actualCoordinates = [], // the coordinates of actual move
        actualIsPromotion = false, // boolean, is true if this move is a promotion move
        actualPromotion = 0, // id of promotion piece
        enPassant = -1, // coordiantes of enpassant square
        zIndex = 50, // z-index property only for graphical effects
        pawnMoves = 0; // variable for the pawn move variables (for fen string)

    // methods
    
    this.restart = function () {
        var self = this;
        self.parseFEN(defaultFEN);
        self.movesList = [new move([-1,-1],false,0,defaultFEN)];
        self.findLegalMoves();
    }

    // parse the fen string passed as argument
    this.parseFEN = function (fen) {
        this.position = zeroArray(128); // clean position vector
        //check if argument is a valid fen string
        if (!validate_FEN(fen)) fen = defaultFEN;       

        var fenObj = _.object(['position', 'turn', 'castle','enpassant','pawnMoves','movesLength'],fen.split(' '));
        var actualIndex = 0; 
        for (var i = 0; i < fenObj.position.length; i++) {
            var ch = fenObj.position.charAt(i);
            if (!isNaN(ch)) actualIndex += parseInt(ch); // ch is a number
            else {
                if (ch == '\/') actualIndex += 8;
                else {
                    var color = (ch == ch.toLowerCase()) ? 1 : 0;
                    var pieceType = _.find(['PAWN','ROOK','NIGHT','BISHOP','QUEEN','KING'],function (str) {return (str.charAt(0) == ch.toUpperCase())});
                    this.position[actualIndex] = new piece(color,pieceType); // create new piece and put it in position
                    if (ch == 'k') this.kingsPosition[1] = actualIndex; // update black king position
                    if (ch == 'K') this.kingsPosition[0] = actualIndex; // update white king position
                    actualIndex ++;
                }
            }
        }
        this.turn = (fenObj.turn == 'w') ? 0 : 1; // update turn
        this.castles = [[false,false],[false,false]]; // clean castle avaiblity
        for (var i = 0; i < fenObj.castle.length; i++) {
            var ch = fenObj.castle.charAt(i);
            if (ch == '-') break;
            var row = (ch == ch.toLowerCase()) ? 1 : 0;
            var col = (ch.toLowerCase() == 'k') ? 1 : 0;
            this.castles[row][col] = true;
        }
        if (fenObj.enpassant != '-') enPassant = alg2coor(fenObj.enpassant);
        pawnMoves = parseInt(fenObj.pawnMoves);
    };

    // get the fen string
    this.getFEN = function () {
        var fen = '';
        for (var row = 0; row < 8; row++) { 
            var zeroCount = 0;
            for (var col = 0; col < 8; col++) {
                var pos = 16*row + col;
                var piece = this.position[pos];
                if (piece == 0) zeroCount++;
                else {
                    if (zeroCount > 0) {
                        fen += zeroCount + piece.getFEN();
                        zeroCount = 0;
                    }
                    else fen += piece.getFEN();
                }
            }
            if (zeroCount != 0) fen += zeroCount;
            if (row != 7) fen += "\/";
        }
        fen = fen + ' ' + ['w','b'][this.turn] + ' ';
        var castleAvaible = false;
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                if (this.castles[i][1-j]) {
                    castleAvaible = true;
                    fen += [['Q','K'],['q','k']][i][1-j];
                }
            }
        }
        if (!castleAvaible) fen += '-';
        fen += ' ';
        (enPassant != -1) ? fen += coor2alg(enPassant) : fen += '-';        
        fen += ' ' + pawnMoves;
        fen += ' ' + Math.floor(this.movesList.length/2 + 1);
        return fen;
    };

    // execute the move passed as argument. return the captured piece.
    this.executeMove = function(move) {
        var from = move.coor[0];
        var to = move.coor[1];
        var piece = this.position[from];
        var capturedPiece = this.position[to];
        //update the position at index from and to
        this.position[to] = piece;
        this.position[from] = 0;
        //check if is an enPassant or castle move
        switch (piece.type) {
            case 'PAWN':
                var diff = Math.abs(from - to);
                if (diff == 32) enPassant = (from > to) ? to + 16 : to - 16;
                else if ((diff == 15 || diff == 17) && !capturedPiece) {  //execute enpassant
                    var capturedPosition = from > to ? to + 16 : to - 16;
                    capturedPiece = this.position[capturedPosition];
                    this.position[capturedPosition] = 0;
                }
                break;
            case 'KING':
                this.kingsPosition[this.turn] = to; //update king position
                this.castles[this.turn] = [false,false]; //set castle to false
                if (Math.abs(from - to) == 2) { //make castle
                    var rookTo = from + (from > to ? -1 : 1);
                    var rookFrom = from + (from > to ? -4 : 3);
                    this.position[rookTo] = this.position[rookFrom];
                    this.position[rookFrom] = 0;
                }
                break;
            case 'ROOK': //set castle to false
                if (this.turn == 1) {
                    if (from == 0) this.castles[1][0] = false;
                    else if (from == 7) this.castles[1][1] = false;
                }
                else if (this.turn == 0) {
                    if (from == 112) this.castles[0][0] = false;
                    else if (from == 119) this.castles[0][1] = false;
                }
                break;
        }
        //take carefull of promotion
        if (move.isPromotion) this.position[to].type = ['QUEEN','ROOK','NIGHT','BISHOP'][move.promotion];
        this.turn = 1 - this.turn;
        return capturedPiece;
    };

    // is player's king checked?
    this.isChecked = function (player) {
        var self = this;
        var bdir = [-15,15,-17,17]; // bishop direction
        var rdir = [-1,1,-16,16]; // rook direction
        var ndir = [-14,14,-18,18,-31,31,-33,33]; // night direction
        var i = self.kingsPosition[player];
        for (var k = 0; k < 4; k++) {
            var onBoard = _.filter(_.map(_.range(1,8),function (num) {return i + num*bdir[k];}), function (num) {return !(num & 0x88);});
            var occupied = _.find(onBoard, function (num) {return self.position[num] != 0;});
            if (!(_.isUndefined(occupied)) && self.position[occupied].color == 1 - player && ['QUEEN','BISHOP'].indexOf(self.position[occupied].type) != -1) return true;
        }
        for (var k = 0; k < 4; k++) {
            var onBoard = _.filter(_.map(_.range(1,8),function (num) {return i + num*rdir[k];}), function (num) {return !(num & 0x88);});
            var occupied = _.find(onBoard, function (num) {return self.position[num] != 0;});
            if (!(_.isUndefined(occupied)) && self.position[occupied].color == 1 - player && ['QUEEN','ROOK'].indexOf(self.position[occupied].type) != -1) return true;
        }
        for (var k = 0; k < 8; k++) {
            if (!((i + ndir[k]) & 0x88) && self.position[i + ndir[k]].color == 1 - player && self.position[i + ndir[k]].type == 'NIGHT') return true;
        }
        if (player == 0) {
            if (!((i - 15) & 0x88) && self.position[i - 15].type == 'PAWN' && self.position[i - 15].color == 1) return true;
            if (!((i - 17) & 0x88) && self.position[i - 17].type == 'PAWN' && self.position[i - 17].color == 1) return true;
        }
        if (player == 1) {
            if (!((i + 15) & 0x88) && self.position[i + 15].type == 'PAWN' && self.position[i + 15].color == 0) return true;
            if (!((i + 17) & 0x88) && self.position[i + 17].type == 'PAWN' && self.position[i + 17].color == 0) return true;
        }
        return false;
    };

    // is checkmate ?
    this.isCheckMate = function () { return ( this.isChecked(this.turn) && this.legalMoves.length == 0 );};

    // is stalemate ?
    this.isStaleMate = function () { return ( !this.isChecked(this.turn) && this.legalMoves.length == 0 );};

    // find the legal moves
    this.findLegalMoves = function () {
        var bdir = [-15,15,-17,17]; // bishop direction
        var rdir = [-1,1,-16,16]; // rook direction
        var ndir = [-14,14,-18,18,-31,31,-33,33]; // night direction
        var kdir = [-1,1,-16,16,-15,15,-17,17]; // king direction
        var s = 1;
        var piece = -1;
        var movesTemp = [];
        this.legalMoves = []; // clear the list

        // find the move without considering the checks
        for( var i = 0 ; i < 128 ; i++ ){
            var piece = this.position[i];
            if (piece.color != this.turn) continue;
            else {
                switch (piece.type) {
                    case 'PAWN':
                        if (this.turn == 0) {
                            if (!this.position[i - 16])  {
                                movesTemp.push([i,i - 16]);
                                if (((i & 0x70) == 0x60) && !this.position[i - 32]) movesTemp.push([i,i - 32]);
                            }
                            if (!((i - 15) & 0x88) && this.position[i - 15] && (this.position[i - 15].color != this.turn)) movesTemp.push([i,i - 15]);
                            if (!((i - 17) & 0x88) && this.position[i - 17] && (this.position[i - 17].color != this.turn)) movesTemp.push([i,i - 17]);
                        }
                        else {
                            if (!this.position[i + 16])  {
                                movesTemp.push([i,i + 16]);
                                if (((i & 0x70) == 0x10) && !this.position[i + 32]) movesTemp.push([i,i + 32]);
                            }
                            if (!((i + 15) & 0x88) && this.position[i + 15] && (this.position[i + 15].color != this.turn)) movesTemp.push([i,i + 15]);
                            if (!((i + 17) & 0x88) && this.position[i + 17] && (this.position[i + 17].color != this.turn)) movesTemp.push([i,i + 17]);
                        }
                        break;
                    case 'NIGHT':
                        for (var k = 0; k <= 7; k++) {
                            if (!((i + ndir[k]) & 0x88) && (this.position[i + ndir[k]] == 0 || this.position[i + ndir[k]].color != this.turn )) movesTemp.push([i,i+ndir[k]]);
                        }
                        break;
                    case 'BISHOP':
                        for (var k = 0; k < 4; k++) {
                            var step = 1;
                            while (!(((i + step*bdir[k]) & 0x88)) && !this.position[i + step*bdir[k]]) {
                                movesTemp.push([i,i+step*bdir[k]]);
                                step++;
                            }
                            if (!(((i + step*bdir[k]) & 0x88)) && this.position[i + step*bdir[k]].color != this.turn) movesTemp.push([i,i+step*bdir[k]]);
                        }
                        break;
                    case 'ROOK':
                        for (var k = 0; k < 4; k++) {
                            var step = 1;
                            while (!(((i + step*rdir[k]) & 0x88)) && !this.position[i + step*rdir[k]]) {
                                movesTemp.push([i,i+step*rdir[k]]);
                                step++;
                            }
                            if (!(((i + step*rdir[k]) & 0x88)) && this.position[i + step*rdir[k]].color != this.turn) movesTemp.push([i,i+step*rdir[k]]);
                        }
                        break;
                    case 'QUEEN':
                        for (var k = 0; k < 8; k++) {
                            var step = 1;
                            while (!(((i + step*kdir[k]) & 0x88)) && !this.position[i + step*kdir[k]]) {
                                movesTemp.push([i,i+step*kdir[k]]);
                                step++;
                            }
                            if (!(((i + step*kdir[k]) & 0x88)) && this.position[i + step*kdir[k]].color != this.turn) movesTemp.push([i,i+step*kdir[k]]);
                        }
                        break;
                    case 'KING':
                        for (var k = 0; k < 8; k++) {
                            if (!(((i + kdir[k]) & 0x88)) && (!this.position[i + kdir[k]] || this.position[i + kdir[k]].color != this.turn)) movesTemp.push([i,i+kdir[k]]);
                        }
                        break;
                }
            }
        }
        
        if (enPassant != -1) {
            for (var i = 0; i < 2; i++) {
                var posToCheck = enPassant + (this.turn == 0 ? 16 : -16) + Math.pow(-1,i);
                if (!(posToCheck & 0x88) && this.position[posToCheck] != 0  && this.position[posToCheck].color == this.turn &&  this.position[posToCheck].type == 'PAWN') {
                    movesTemp.push([posToCheck,enPassant]);
                }
            }
        }
        // filter the move considering the checks
        var castlesTemp = [[0,0],[0,0]];
        var turnTemp = this.turn;
        var positionTemp = [];
        var kingsTemp = [];
        for (var i = 0; i < 128; i++) {
            positionTemp.push(this.position[i]);
        }
        for (var i = 0; i < 2; i++) {
            kingsTemp.push(this.kingsPosition[i]);
            for (var j = 0; j < 2; j++) {
                castlesTemp[i][j] = this.castles[i][j];
            }
        }
        for (var t = 0; t < movesTemp.length; t++) {
            var move = movesTemp[t];
            this.executeMove({'coor': move, 'type': 0, 'promotion': 0});
            if (!this.isChecked(1-this.turn)) {
                this.legalMoves.push(move);
            }
            for (var i = 0; i < 128; i++) {
                this.position[i] = positionTemp[i];
            }
            for (var i = 0; i < 2; i++) {
                this.kingsPosition[i] = kingsTemp[i];
                for (var j = 0; j < 2; j++) {
                    this.castles[i][j] = castlesTemp[i][j];
                }
            }
            this.turn = turnTemp;
        }
        
        movesTemp = [];
        if (this.turn == 0 && this.castles[0][1] && !(this.position[7*16+5]) && !(this.position[7*16+6]) && array_belong(this.legalMoves,[7*16 + 4,7*16 + 5])) movesTemp.push([7*16 + 4,7*16 + 6]);
        if (this.turn == 0 && this.castles[0][0] && !(this.position[7*16+1]) && !(this.position[7*16+2]) && !(this.position[7*16+3]) && array_belong(this.legalMoves,[7*16 + 4,7*16 + 3])) movesTemp.push([7*16 + 4,7*16 + 2]);
        if (this.turn == 1 && this.castles[1][1] && !(this.position[5]) && !(this.position[6]) && array_belong(this.legalMoves,[4,5])) movesTemp.push([4,6]);
        if (this.turn == 1 && this.castles[1][0] && !(this.position[1]) && !(this.position[2]) && !(this.position[3]) && array_belong(this.legalMoves,[4,3])) movesTemp.push([4,2]);
        for (var t = 0; t < movesTemp.length; t++) {
            var move = movesTemp[t];
            this.executeMove({'coor': move, 'type': 0, 'promotion': 0});
            if (!this.isChecked(1-this.turn)) {
                this.legalMoves.push(move);
            }
            for (var i = 0; i < 128; i++) {
                this.position[i] = positionTemp[i];
            }
            for (var i = 0; i < 2; i++) {
                this.kingsPosition[i] = kingsTemp[i];
                for (var j = 0; j < 2; j++) {
                    this.castles[i][j] = castlesTemp[i][j];
                }
            }
            this.turn = turnTemp;
        }
        enPassant = -1;
    };
    
    this.move2PGN = function(start,end,capturing,otherMoves) {
        var self = this;
        var piece = self.position[end];
        var moveString = '';
        var endString = coor2alg(end);

        if (piece.type != 'PAWN' && !actualIsPromotion) moveString += piece.type.charAt(0);
        else {
            if (Math.abs(start - end) == 15 || Math.abs(start - end) == 17) {
                moveString += coor2alg(start).charAt(0);
            }
        }

        var others = _.map(_.filter(otherMoves, function (move) {return (move[1] == end && move[0] != start && self.position[move[0]].type == piece.type);}), function (move) { return move[0];});    
        uniqueCol = true;
        for (var i = 0; i < others.length; i++) {
            if ((others[i] - start)%16 == 0) {
                uniqueCol = false;
                break;
            }
        }
        uniqueRow = true;
        if (!uniqueCol) {
            for (var i = 0; i < others.length; i++) {
                if ((start-(start%16))/16 == (others[i]-(others[i]%16))/16) {
                    uniqueRow = false;
                    break;
                }
            }
        }
        if (piece.type == 'PAWN') {
            uniqueRow = true;
            uniqueCol = true;
        }
        if (others.length > 0) {
            if (uniqueCol) moveString += coor2alg(start).charAt(0);
            else if (uniqueRow) moveString += coor2alg(start).charAt(1);
            else moveString += coor2alg(start);
        }
                
        if (capturing) moveString += 'x';
        moveString += endString;
        if (piece.type == 'KING') {
            if (end - start == 2) moveString = 'O-O';
            if (end - start == -2) moveString = 'O-O-O';
        }
        if (actualIsPromotion) moveString += '=' + 'QRNB'.charAt(actualPromotion);
        if (self.isChecked(self.turn)) {
            if (self.isCheckMate()) moveString += '#';
            else moveString += '+';
        }
        return moveString;
    };

    this.pgn2move = function (pgn) {
        var self = this;
        var _coor, _promo = 0, _isPromo = false, _fen = '';
        pgn = pgn.replace('+','').replace('#','').replace('x','');
        if (pgn == 'O-O') {
            if (self.turn == 0) _coor = [7*16 + 4,7*16 + 6];
            if (self.turn == 1) _coor = [4,6];
        }
        else if (pgn == 'O-O-O') {
            if (self.turn == 0) _coor = [7*16 + 4,7*16 + 2];
            if (self.turn == 1) _coor = [4,2];
        }
        else {
            splittedPgn = pgn.split('=');
            if (splittedPgn.length == 2) {
                _isPromo = true;
                _promo = ['Q','R','N','B'].indexOf(splittedPgn[1]);
            }
            pgn = splittedPgn[0];
            endSquare = alg2coor(pgn.slice(pgn.length-2,pgn.length));
            startString = pgn.slice(0,pgn.length-2);
            if (startString.length > 0 && startString.charAt(0) == startString.charAt(0).toUpperCase()) {
                var t = startString.charAt(0);
            }
            else {
                startString = 'P' + startString;
                var t = 'P';
            }
            filteredMoves = _.filter(self.legalMoves, function(coor) { return (coor[1] == endSquare && self.position[coor[0]].type.charAt(0) == t); });
            if (filteredMoves.length == 1) _coor = filteredMoves[0];
            else if (filteredMoves.length == 2) {
                var col = ['a','b','c','d','e','f','g','h'].indexOf(startString.charAt(1));
                if (col != -1) {
                    filteredMoves = _.filter(filteredMoves, function(coor) { return (coor[0] - col) % 16 == 0; });
                } 
                else filteredMoves = _.filter(filteredMoves, function(coor) { return Math.abs(coor[0] - parseInt(startString.charAt(1))) <= 7; }); 
            }
            else if (filteredMoves.length == 3) {
                var col = ['a','b','c','d','e','f','g','h'].indexOf(startString.charAt(1));
                var row = parseInt(startString.charAt(1));
                filteredMoves = _.filter(filteredMoves, function(coor) { return (Math.abs(coor[0] - row) <= 7 && (coor[0] - col) % 16 == 0); }); 
            }
            _coor = filteredMoves[0]
        }
        return new move(_coor,_isPromo,_promo,_fen);
    };
}

function piece (color,type) {
    this.color = color;
    this.type = type;
    this.setType = function (newType) {
        this.type = newType;
    }
    this.getFEN = function() {
        var fenCharacter = this.type.charAt(0);
        if (color) fenCharacter = fenCharacter.toLowerCase();
        return fenCharacter;
    }    
}