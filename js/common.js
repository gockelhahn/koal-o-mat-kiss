/* Copyright (c) 2016 Felix Bolte */

// define json data as available in qual-o-mat-data
// see https://github.com/gockelhahn/qual-o-mat-data
var data_url = 'https://raw.githubusercontent.com/gockelhahn/qual-o-mat-data/master';
// instead, you can set a relative path, for self hosted data dir
//var data_url = 'data';
var json_list = 'list.json';
var json_overview = 'overview.json';
var json_answer = 'answer.json';
var json_party = 'party.json';
var json_statement = 'statement.json';
var json_opinion = 'opinion.json';

// save the states of the selection
var valid_statements = 0;
var selected = '';
var overview_loaded;
var overview;
var answer_loaded;
var answer;
var party_loaded;
var party;
var statement_loaded;
var statement;
var opinion_loaded;
var opinion;

// reset overview vars
function reset_overview() {
    overview_loaded = false;
    overview = null;
}

// reset answer vars
function reset_answer() {
    answer_loaded = false;
    answer = null;
}

// reset statement vars
function reset_statement() {
    statement_loaded = false;
    statement = null;
}

// reset party vars
function reset_party() {
    party_loaded = false;
    party = null;
}

// reset opinion vars
function reset_opinion() {
    opinion_loaded = false;
    opinion = null;
}

// clear error messages
function reset_error() {
    document.getElementById('error_election').innerHTML = '';
}

// clear header
function reset_header() {
    document.getElementById('header_election').innerHTML = '';
}

// clear content
function reset_content() {
    document.getElementById('content_election').innerHTML = '';
}

// clear result
function reset_result() {
    document.getElementById('result_election').innerHTML = '';
}

// reset all
function reset() {
    // clear html dom
    reset_error();
    reset_header();
    reset_content();
    reset_result();
    // clear states
    reset_overview();
    reset_answer();
    reset_statement();
    reset_party();
    reset_opinion();
}

// escape html special characters: &,<,>,",'
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// fetch json files asynchronously and call callback handler with javascript object
function read_json_from_file(json_file, callback) {
    var request = new XMLHttpRequest();
    request.overrideMimeType("application/json");
    request.open('GET', json_file, true);
    request.onreadystatechange = function () {
        // if request finished
        if (request.readyState === 4) {
            var response_json = null;
            // if http is OK or NOT MODIFIED
            // or code is 0 in case it was opened as local file
            // (see https://www.w3.org/TR/XMLHttpRequest/#the-status-attribute)
            if (request.status === 0 || request.status === 200 || request.status === 304) {
                // uncomment the following line to see successful requests
                //console.log('SUCCES: ' + json_file);
                // try to parse response as json
                try {
                    response_json = JSON.parse(request.response);
                } catch (error) {
                    // set response_json again to null as the "try" will mangle it
                    response_json = null;
                    // log error into console
                    console.log('Response was: ' + request.response);
                    console.log('Failed to parse json (' + json_file + '): ' + error);
                };
            } else {
                console.log('Failed to load json (' + json_file + ') - HTTP CODE: ' + request.status);
            };
            // go back with parsed json or null
            callback(response_json);
        };
    };
    // set request timeout to 6 seconds
    request.timeout = 6000;
    request.ontimeout = function () {
        // if request did not finish after set timeout
        console.log('Failed to to load json (' + json_file + ') due to a timeout of ' + request.timeout + 'ms');
        // still go back with null
        callback(null);
    };
    request.send();
}

// calculate and save result for each party
function calculate_result() {
    // add result property for saving results
    for (var i = 0; i < party.length; i++) {
        party[i].result = 0;
    };

    // reset statements
    valid_statements = 0;
    
    for (var i = 0; i < statement.length; i++) {
        var radio_group_name = 'radio_statement' + i;
        var selector = 'input[name="' + radio_group_name + '"]:checked';
        var checked_button = document.querySelector(selector);
        // if the skip button is checked, ignore this statement
        if ((checked_button.id).indexOf('skip') > -1) {
            continue;
        };
        // find user opinion from selected radio button
        var user_opinion = parseInt(checked_button.value);
        // count unskipped statements
        valid_statements++;
        
        // add points for matching statement
        for (var j = 0; j < party.length; j++) {
            for (var k = 0; k < opinion.length; k++) {
                if (opinion[k].party === party[j].id
                        && opinion[k].statement === statement[i].id
                        && opinion[k].answer === user_opinion) {
                    party[j].result++;
                };
            };
        };
    };
}

// show error message
function show_error(msg) {
    if (msg === null) {
        msg = 'Failed to load or parse needed data. See console for more info. Please try again!';
    };
    var final_msg = '<pre>ERROR: ' + msg + '</pre>';
    document.getElementById('error_election').innerHTML = final_msg;
}

// fill up the dropdown menu with available elections
function show_list(elections) {
    var error = '';
    // list not loaded correctly, so show error
    if (elections === null) {
        show_error(null);
    } else if (elections.length == 0) {
        show_error('No available elections found.');
    } else {
        // get dropdown menu
        var select_election = document.getElementById('select_election');
        for (var i = 0; i < elections.length; i++) {
            // we do not need to use escapeHtml here, because option.text takes it literally
            var election = elections[i];
            var new_option = new Option(election);
            select_election.appendChild(new_option);
        };
        // enable dropdown menu and button to load election
        document.getElementById('select_election').disabled = false;
        document.getElementById('button_load_election').disabled = false;
    };
}

// show brief description about selected election
function show_header() {
    // overview not loaded correctly, so show error
    if (overview === null) {
        show_error('Failed to load or parse the election overview. See console for more info.');
    } else {
        var header = '<h4>' + escapeHtml(overview.title) + ' (<a target="_blank" href="' + escapeHtml(overview.info) + '">info</a>) am ' + escapeHtml(overview.date.slice(0,10)) + ' (<a target="_blank" href="' + escapeHtml(overview.data_source) + '">quelle</a>)</h4>';
        document.getElementById('header_election').innerHTML = header;
    };
    
    // enable election loading button only when answer and statement finished loading as well
    if (answer_loaded
            && statement_loaded) {
        document.getElementById('button_load_election').disabled = false;
    };
}

// show main page as statement and possible answers
function show_content() {
    // not all files loaded correctly, so show error
    if (statement === null
            || answer === null) {
        show_error(null);
    } else {
        var content = '';
        for (var i = 0; i < statement.length; i++) {
            var radio_group_name = 'radio_statement' + i;
            var radio_id_skip = radio_group_name + 'skip';
            var radio_id_skip_label = 'Überspringen';
            // show statement
            content += '<fieldset><legend><strong>' + (i + 1) + '.</strong> <em>' + escapeHtml(statement[i].text) + '</em></legend>';
            // create skip radio button
            content += '<input type="radio" name="' + radio_group_name + '" id="' + radio_id_skip + '" value="skip" checked><label for="' + radio_id_skip + '">' + radio_id_skip_label + '</label>';
            for (var j = 0; j < answer.length; j++) {
                var radio_id = radio_group_name + 'answer' + escapeHtml(answer[j].id);
                // create radio button for each given answer
                content += '<input type="radio" name="' + radio_group_name + '" id="' + radio_id + '" value="' + escapeHtml(answer[j].id) + '"><label for="' + radio_id + '">' + escapeHtml(answer[j].message) + '</label>';
            };
            content += '</fieldset>';
        };
        content += '<br><button id="button_load_result">Auswertung</button>';
        document.getElementById('content_election').innerHTML = content;
        // listener can only be added after setting innerHTML
        document.getElementById('button_load_result').addEventListener('click', load_result);
    };
    
    // enable election loading button only when overview finished loading as well
    if (overview_loaded) {
        document.getElementById('button_load_election').disabled = false;
    };
}

// show parties and their results corresponding to the user answers
function show_result() {
    // not all files loaded correctly, so show error
    if (party === null
            || opinion === null) {
        show_error(null);
    } else {
        calculate_result();
        // sort parties by their result (top down)
        party.sort(function(a, b) { 
            return b.result - a.result;
        });
        
        // create numbered list and add all parties
        var result = '<ol type="1">';
        for (var i = 0; i < party.length; i++) {
            result += '<li><strong>' + escapeHtml(party[i].name) + '</strong>: ' + party[i].result + ' von ' + valid_statements + ' Punkten</li>';
        };
        result += '</ol>';
        document.getElementById('result_election').innerHTML = result;
    };
    
    // go to the top where the result is displayed
    window.scrollTo(0, 0);
    // show button again, for reloading result (after changing opinions)
    document.getElementById('button_load_result').disabled = false;
}

function callback_load_list(object) {
    show_list(object);
}

function callback_load_overview(object) {
    overview = object;
    show_header();
    overview_loaded = true;
}

function callback_load_answer(object) {
    answer = object;
    if (statement_loaded) {
        show_content();
    };
    answer_loaded = true;
}

function callback_load_party(object) {
    party = object;
    if (opinion_loaded) {
        show_result();
    };
    party_loaded = true;
}

function callback_load_statement(object) {
    statement = object;
    if (answer_loaded) {
        show_content();
    };
    statement_loaded = true;
}

function callback_load_opinion(object) {
    opinion = object;
    if (party_loaded) {
        show_result();
    };
    opinion_loaded = true;
}

function load_election() {
    document.getElementById('button_load_election').disabled = true;
    
    // check if selected option was already loaded before
    if (document.getElementById('select_election').value !== selected) {
        // save selected election
        selected = document.getElementById('select_election').value;
        // clear page and reset states
        reset();
    };
    
    // do not load json if already loaded
    if (overview !== null) {
        show_header();
    } else {
        reset_error();
        reset_header();
        reset_overview();
        read_json_from_file(data_url + '/' + selected + '/' + json_overview, callback_load_overview);
    };
    
    // do not load json if already loaded
    if (answer !== null && statement != null) {
        show_content();
    } else {
        reset_error();
        reset_content();
        // if both are null, we have to set their $_loaded to false before calling each's read_json_from_file
        if (answer === null && statement === null) {
            answer_loaded = false;
            statement_loaded = false;
        };
        if (answer === null) {
            reset_answer();
            read_json_from_file(data_url + '/' + selected + '/' + json_answer, callback_load_answer);
        };
        if (statement === null) {
            reset_statement();
            read_json_from_file(data_url + '/' + selected + '/' + json_statement, callback_load_statement);
        };
    };
}

function load_result() {
    document.getElementById('button_load_result').disabled = true;
    
    // do not load json if already loaded
    if (party !== null && opinion !== null) {
        show_result();
    } else {
        reset_result();
        // if both are null, we have to set their $_loaded to false before calling each's read_json_from_file
        if (party === null && opinion === null) {
            party_loaded = false;
            opinion_loaded = false;
        };
        if (party === null) {
            reset_party();
            read_json_from_file(data_url + '/' + selected + '/' + json_party, callback_load_party);
        };
        if (opinion === null) {
            reset_opinion();
            read_json_from_file(data_url + '/' + selected + '/' + json_opinion, callback_load_opinion);
        };
    };
}

function init() {
    // clear page and reset states
    reset();
    // add click action to button
    document.getElementById('button_load_election').addEventListener('click', load_election);
    // load json list of available elections
    read_json_from_file(data_url + '/' + json_list, callback_load_list);
}

// call init when page has loaded
window.addEventListener('load', init);
