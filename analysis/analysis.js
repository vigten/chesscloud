var winston = require('winston');
var spawn = require('child_process').spawn;

winston.add(winston.transports.File, { filename: 'analysis.log' });



var games = [
  {
    id: 'xbdnjej4jfh56h',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moves: ['e2e4', 'd7d5', 'e4d5', 'd8d5', 'b1c3', 'd5d7', 'd2d4', 'e7e5', 'd4e5', 'd7d1', 'c3d1', 'b8c6', 'g1f3', 'c8e6', 'd1e3', 'g8e7', 'c1d2', 'e7g6', 'f1b5', 'e8c8', 'b5c6', 'b7c6', 'b2b3', 'f8a3', 'd2c3', 'c8b7', 'f3g5', 'g6f4', 'g5e6', 'f7e6', 'b3b4', 'h8f8', 'e3c4', 'f4g2', 'e1f1', 'f8f3', 'c4a3', 'f3c3', 'a3b1', 'g2e3', 'f1e2', 'c3c2', 'e2e3', 'c6c5', 'b4c5', 'd8d5', 'f2f4', 'g7g5', 'f4g5', 'c2c5', 'h2h4', 'd5e5', 'e3f4', 'e5f5', 'f4g4', 'f5d5', 'g4h5', 'e6e5', 'h1h3', 'd5d1', 'h5h6', 'd1d7', 'b1c3', 'c5c6', 'h6h5', 'd7d4', 'a1e1']
  },
  {
    id: 'bdgg45yytl31',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moves: ['d2d4', 'g8f6', 'b1c3', 'd7d5', 'c1f4', 'e7e6', 'e2e3', 'f8b4', 'f1d3', 'b4c3', 'b2c3', 'e8g8', 'g1f3', 'b8c6', 'e1g1', 'c8d7', 'd1e2', 'f6e4', 'c3c4', 'f7f6', 'c4d5', 'e6d5', 'd3e4', 'd5e4', 'f3d2', 'g7g5', 'f4g3', 'f8e8', 'h2h4', 'h7h6', 'd4d5', 'c6a5', 'f2f3', 'd7f5', 'f3e4', 'f5e4', 'd2e4', 'e8e4', 'e2d3', 'd8e8', 'f1f6', 'a5c4', 'a1f1', 'c4d6']
  },
  {
    id: 'ggfnkk4440k',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moves: ['e2e4', 'd7d5', 'e4d5', 'd8d5', 'b1c3', 'd5e6', 'f1e2', 'g8f6', 'd2d4', 'f6d5', 'g1f3', 'd5c3', 'b2c3', 'e6c6', 'e1g1', 'c6c3', 'c1d2', 'c3b2', 'a1b1', 'b2a2', 'f3e5', 'a2d5', 'e2c4', 'd5d4', 'c4f7', 'e8d8' ]
  },
  {
    id: '12345abcdef',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moves: ['e2e4', 'd7d5', 'e4d5', 'd8d5', 'g1f3', 'g8f6', 'b1c3', 'd5a5', 'd2d4', 'b8c6', 'c1d2', 'e7e6', 'c3b5', 'f8b4', 'c2c3', 'b4e7', 'a2a4', 'a5b6', 'a4a5', 'c6a5', 'c3c4', 'a5c4', 'f1c4', 'a7a5', 'e1g1', 'c8d7', 'd1a4', 'c7c6', 'b5c3', 'e8g8', 'a4c2', 'c6c5', 'd4d5', 'b6d6', 'd5e6', 'd7e6', 'c4e6', 'f7e6', 'f1e1', 'f6g4', 'c3b5', 'd6c6', 'c2c4', 'a8a6' ]
  }
];

function msToTime(milliseconds) {
  function addZ(n) {
    return ('0' + n).slice(-2);
  }
  var ms = milliseconds % 1000;
  milliseconds = (milliseconds - ms) / 1000;
  var secs = milliseconds % 60;
  milliseconds = (milliseconds - secs) / 60;
  var mins = milliseconds % 60;
  var hrs = (milliseconds - mins) / 60;
  return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs) + '.' + ('00' + ms).slice(-3);
}


function analyzeGame(gamesList) {
  if (gamesList.length == 0) {
    winston.info('games list is empty')
    return true;
  }
  var game = gamesList.pop() 
  var startDate = new Date();
  var movedepth = 10;
  var playedMoves = '';
  var infolines = 'score cp ?';
  var count = 0;
  var startTurn = ['w', 'b'].indexOf(game.fen.split(' ')[1]);
  var uci = spawn('critter', []);
  var betterMoves = [];
  var analysis = [];

  winston.info('start analysis', {'gameId': game.id});
  uci.stderr.on('data', function (data) {
    winston.warn('stderr: ' + data, {'gameId': game.id});
  });

  uci.on('close', function (code) {
    winston.info('child process exited with code ' + code, {'gameId': game.id, 'depth': movedepth});
    analyzeGame(gamesList);
  });

  uci.stdout.on('data', function (data) {
    if (('' + data).split(' ')[0] == 'Critter') {
      uci.stdin.write('setoption name MultiPV value 1\n');
      uci.stdin.write('setoption name Ponder value false\n');
      uci.stdin.write('uci\n');
    }
    else if (data.slice(-6) == 'uciok\n') {
      uci.stdin.write('ucinewgame\n');
      uci.stdin.write('isready\n');
    }
    else if (data == 'readyok\n') {
      uci.stdin.write('position fen ' + game.fen + ' moves ' + playedMoves + '\n');
      uci.stdin.write('go depth ' + movedepth + '\n');
    }
    else if (('' + data).indexOf('bestmove') != -1) {
      var bettermove = ('' + data).split('bestmove ')[1].split(' ')[0];
      var score = infolines.split('score ')[1].split(' ').slice(0,2);
      var sign = (startTurn + count%2 - 0.5) < 0 ? 1 : -1;
      analysis.push({
        'move': game.moves[count],
        'scoreAfter': 0,
        'better': bettermove,
        'scoreBefore': score[0].replace(/(\r\n|\n|\r)/gm,"") + ' ' + sign * score[1]
      });
      if (count > 0) {
        analysis[count - 1].scoreAfter = score[0].replace(/(\r\n|\n|\r)/gm,"") + ' ' + sign * score[1];
        var lostCP = -1*sign*(parseInt(analysis[count - 1].scoreAfter.split(' ')[1]) - parseInt(analysis[count - 1].scoreBefore.split(' ')[1]));
        if (analysis[count - 1].move != analysis[count - 1].better && lostCP < -50) {
          console.log((count - 1) + '\t' + (-1*sign*(parseInt(analysis[count - 1].scoreAfter.split(' ')[1]) - parseInt(analysis[count - 1].scoreBefore.split(' ')[1]))));
        }
      }
      count++;
      if (count > game.moves.length) {
        uci.stdin.write('quit\n');
        var endDate = new Date();
        var time = endDate - startDate;
        winston.info('last position value is ' + analysis[count - 1].scoreBefore, {'gameId': game.id});
        winston.info('analysis finished: analyzed ' + game.moves.length + ' in ' + msToTime(time), {'gameId': game.id});
        return;
      }
      playedMoves = game.moves.slice(0,count).join(' ');
      infolines = 'score cp ?';
      uci.stdin.write('position fen ' + game.fen + ' moves ' + playedMoves + '\n');
      uci.stdin.write('go depth ' + movedepth + '\n');
    }
    else if (('' + data).indexOf('score') != -1) {
      infolines = '' + data;
    }
  });
}


analyzeGame(games);