#!/usr/bin/env node

exports.index = (req, res) ->
	res.render 'index', { title: 'Express' }