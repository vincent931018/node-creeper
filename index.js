var http = require('http');
var https = require('https');
var cheerio = require('cheerio');
var _ = require('lodash');
var config = require('./config');
var fs = require('fs');

//初始化html数据
var html = '';
var author = '';
var pageNum = '';
var answerNum = '';
var i = 1;

//要爬取的网页
var url = config.url;
var urlClone = _.clone(url);

//判断url是http协议还是https协议
var isHttpUrl = function(url,i,pageNum,author,answerNum) {
    url = urlClone + "?page=" + i;
    if (url.indexOf('https') < 0) {
        //根据url获取数据并筛选出有用信息(http模块)
        http.get(url, function(res) {

            //监听数据获取
            res.on('data', function(data) {
                html += data;
            });

            //监听res结束事件
            res.on('end', function() {
                lastHtml = filter(html);
                fs.writeFile('./lastData.txt', lastHtml, function(err) {
                    if (err) console.error(err);
                });
                console.log('作者 ' + author + ' 共有回答' + answerNum + '个，回答页数共有' + pageNum + '页且第' + i + '页数据已爬取完毕！');
                i++;
                if(i === ((pageNum+1)/1)){
                    return;
                }
                isHttpUrl(url,i,pageNum,author,answerNum);
            });
            //监听数据出错
        }).on('error', function() {
            console.log('爬取数据出现错误！');
        });
    } else {
        //根据url获取数据并筛选出有用信息(https模块)
        https.get(url, function(res) {

            //监听数据获取
            res.on('data', function(data) {
                html += data;
            });

            //监听res结束事件
            res.on('end', function() {
                lastHtml = filter(html);
                fs.writeFile('./lastData.txt', lastHtml, function(err) {
                    if (err) console.error(err);
                });
                console.log('作者 ' + author + ' 共有回答 ' + answerNum + ' 个，回答页数共有 ' + pageNum + ' 页且第 ' + i + ' 页数据已爬取完毕！');
                i++;
                if(i === ((pageNum+1)/1)){
                    return;
                }
                isHttpUrl(url,i,pageNum,author,answerNum);
            });
            //监听数据出错
        }).on('error', function() {
            console.log('爬取数据出现错误！');
        });
    }
};

//筛选有用信息函数
var filter = function(html) {

    var $ = cheerio.load(html);
    var lastData = {};
    var answers = [];
    var answerItems = $('.List-item');

    answerItems.map(function(item) {
        var answerTitle = $(this).find('.ContentItem-title').text();
        var answer = $(this).find('.CopyrightRichText-richText').text();
        var answerId = $(this).find('.ContentItem-title').eq(0).find('a').eq(0).attr('href');
        var answerBlock = {
            answerId : answerId.substring((answerId.length-9),answerId.length),
            answerTitle: answerTitle,
            answer: answer
        };
        answers.push(answerBlock);
    })
    lastData.author = author;
    lastData.answerPageNum = pageNum;
    lastData.answerNum = answerNum;
    lastData.answers = answers;
    return JSON.stringify(lastData, null, 4);

};

//初始化
function init(pageNum,author,answerNum) {
    isHttpUrl(url, i,pageNum,author,answerNum);
};

function getPageNum(url) {
    var html = '';
    var answerNum;
    var pageNum;
    https.get(url, function(res) {

            //监听数据获取
            res.on('data', function(data) {
                html += data;
            });

            res.on('end', function() {
                var $ = cheerio.load(html);
                author = $('.ProfileHeader-name').eq(0).text();
                answerNum = $('.Tabs-item').find('.Tabs-meta').eq(0).text();
                pageNum = Math.ceil(answerNum / 20);
                init(pageNum,author,answerNum);
            })
        });
};

getPageNum(url);

