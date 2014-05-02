require 'coffee-script'
express = require 'express'
routes 	= require './routes'
user 	= require './routes/user'
games  = require './routes/games'
http 	= require 'http'
path 	= require 'path'
_ 		= require 'underscore'

app = express()

# all environments
app.set 'port', process.env.PORT or 3000
app.set 'views', __dirname + '/views'
app.set 'view engine', 'jade'

app.use express.favicon()
app.use express.logger('dev')
app.use express.bodyParser()
app.use express.methodOverride()
app.use app.router
app.use require('stylus').middleware(__dirname + '/public')
app.use express.static(path.join __dirname, 'public') 

# development only
if 'development' is app.get('env')
	app.use express.errorHandler()

app.get '/', routes.index
app.get '/users', user.list
app.get '/test', games.test

http.createServer(app).listen(app.get('port'), ->
  console.log "Express server listening on port #{app.get('port')}"
  console.log "#{app.get('env')}"
)
