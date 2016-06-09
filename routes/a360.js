var request = require('request');
var config = require('./config');

module.exports = {
    getComments: function (itemId, env, token, onsuccess) {
        makeRequest(config.a360comments(itemId), null, 'GET', env, token, function (body) {
            var comments = [];
            if (body.data != null) {
                body.data.forEach(function (item, index) {
                    var author = getAuthorById(body, item.relationships.createdBy.data.id);
                    comments.push(
                        {
                            comment: item.attributes.content,
                            date: item.attributes.created,
                            author: author
                        }
                    )
                });
                comments.reverse(); // newest first
            }
            onsuccess(comments);
        });
    },

    addComment: function (versionId, comment, env, token, onsuccess) {
        var newVersionCommentSpec =
        {
            data: {
                type: "comments",
                attributes: {
                    content: comment
                },
                relationships: {
                    version: {
                        data: {
                            type: 'versions',
                            id: versionId
                        }
                    }
                }
            }
        }

        makeRequest(config.a360addComment, JSON.stringify(newVersionCommentSpec), 'POST', env, token, function (body) {
            onsuccess(body);
        });
    }
};

function getAuthorById(body, authorId) {
    var author = '';
    body.included.forEach(function (item, index) {
        if (item.id === authorId) {
            author = item.attributes.firstName;
        }
    });
    return author;
}


function makeRequest(resource, data, method, env, token, onsuccess) {
    console.log('Requesting ' + config.baseURL(env) + resource);
    request({
        url: config.baseURL(env) + resource,
        method: method,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/vnd.api+json', // this required here
            'Content-Type': 'application/vnd.api+json'
        },
        body: data
    }, function (error, response, body) {
        if (error != null) console.log(error); // connection problems
        body = JSON.parse(body);
        if (body.errors != null)console.log(body.errors);
        onsuccess(body);
    })
}