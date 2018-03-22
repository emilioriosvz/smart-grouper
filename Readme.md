# Smart keyword grouper tool

[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

This experiment consist of grouping, in a more or less smart way, a set of keywords into topics.

## Installation
    npm i

## Run the server
    npm start

## Endpoint
There is only one endpoint, where you will have to pass the list of sentences to process

    POST localhost:3000/grouper

    {
      "text": "...list of sentences (separated by \n or comma)"
    }

In addition you can pass two query params.
  + `lang`:  which accept `en` and `es` (you can try with other languages but you know, I will not be responsible of the disaster ¯\_(ツ)_/¯)
  + `minSize`: which means that the grouper will not create smart groups smaller than the value

## Example
I have prepared a [test call object](https://github.com/emilioriosvz/smart-grouper/blob/master/example/request-body.json) to do some test and this is the [response](https://github.com/emilioriosvz/smart-grouper/blob/master/example/response.json) using it, so you can get an idea of what this experiment can do 🙃


---

Use it, break it and [tell me](https://twitter.com/emiiio_rios) what you ~~think~~ drink! 🍻
