/* Copyright (c) 2017 Felix Bolte */

// define json data as available in qual-o-mat-data
// see https://github.com/gockelhahn/qual-o-mat-data
var data_url = 'https://raw.githubusercontent.com/gockelhahn/qual-o-mat-data/master';
// instead, you can set a relative path, for self hosted data dir
//var data_url = 'data';
var json_list = 'list.json';
var json_overview = 'overview.json';
var json_party = 'party.json';
var json_opinion = 'opinion.json';

// static strings
var allparties = 'Alle Parteien';

// save the states of the selection
var selected = '';
var overview_loaded;
var overview;
var party_loaded;
var party;
var opinion_loaded;
var opinion;
var coalition = null;
var statements = 0;

// reset overview vars
function reset_overview() {
    overview_loaded = false;
    overview = null;
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

// clear filter
function reset_filter() {
    document.getElementById('filter_party').innerHTML = '';
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
    reset_filter();
    reset_result();
    // clear states
    reset_overview();
    reset_party();
    reset_opinion();
    coalition = null;
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

// calculate and save result for each coalition
function calculate_result() {
    coalition = [];
    
    // sort party array by id asc
    party.sort(function(a, b) { 
        return a.id - b.id;
    });
    
    // sort opinion by party asc,statement asc
    opinion.sort(function(a, b) {
        if (a.party != b.party) {
            return a.party - b.party;
        };
        return a.statement - b.statement;
    });
    
    // for two party coalitions
    for (var x = 0; x < party.length; x++) {
        // only calculate one way (x,y || y,x)
        // and skip if party compared to itself
        for (var y = x + 1; y < party.length; y++) {
            var match = 0;
            var obj = {};
            obj.first = party[x];
            obj.second = party[y];
            obj.third = null;
            for (var i = 0; i < statements; i++) {
                // calculate opinion id by party id and statement id
                var opinionx = x * statements + i;
                var opiniony = y * statements + i;
                // add points for matching statements
                if (opinion[opinionx].party === x
                        && opinion[opiniony].party === y
                        && opinion[opinionx].statement === opinion[opiniony].statement
                        && opinion[opinionx].answer === opinion[opiniony].answer) {
                    match++;
                };
            };
            obj.match = match;
            coalition.push(obj);
            
            // for three party coalitions
            // only calculate one way (y,z || z,y)
            // and skip if party compared to itself
            for (var z = y + 1; z < party.length; z++) {
                match = 0;
                var obj2 = {};
                obj2.first = party[x];
                obj2.second = party[y];
                obj2.third = party[z];
                for (var i = 0; i < statements; i++) {
                    // calculate opinion id by party id and statement id
                    var opinionx = x * statements + i;
                    var opiniony = y * statements + i;
                    var opinionz = z * statements + i;
                    // add points for matching statements
                    if (opinion[opinionx].party === x
                            && opinion[opiniony].party === y
                            && opinion[opinionz].party === z
                            && opinion[opinionx].statement === opinion[opiniony].statement
                            && opinion[opiniony].statement === opinion[opinionz].statement
                            && opinion[opinionx].answer === opinion[opiniony].answer
                            && opinion[opiniony].answer === opinion[opinionz].answer) {
                        match++;
                    };
                };
                obj2.match = match;
                coalition.push(obj2);
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
    document.getElementById('error_election').innerHTML += final_msg;
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
    if (party_loaded
            && opinion_loaded) {
        document.getElementById('button_load_election').disabled = false;
    };
}

// show filter (select box + button) based on party
function show_filter() {
    var error = '';
    // party not loaded correctly, so show error
    if (party === null) {
        show_error(null);
    } else if (party.length == 0) {
        show_error('No available parties found.');
    } else {
        // get dropdown menu
        // create a filter with all parties
        var result = '<span>Filter:</span>&nbsp;';
        result += '<select id="select_party" size="1" disabled></select>&nbsp;';
        result += '<button id="button_filter_party" disabled>Los</button><br>';
        result += '<input name="coalition_size" id="radio_two" value="2" checked="" type="radio">' +
                  '<label for="radio_two">2er-Koalitionen</label>';
        result += '<input name="coalition_size" id="radio_three" value="3" type="radio">' +
                  '<label for="radio_three">3er-Koalitionen</label>';
        result += '<input name="coalition_size" id="radio_all" value="0" type="radio">' +
                  '<label for="radio_all">2er- und 3er-Koalitionen</label>';

        document.getElementById('filter_party').innerHTML = result;
        
        // add "alle" and all parties to the select
        var select_party = document.getElementById('select_party');
        select_party.appendChild(new Option(allparties));
        for (var i = 0; i < party.length; i++) {
            // we do not need to use escapeHtml here, because option.text takes it literally
            var party_name = party[i].name;
            var new_option = new Option(party_name);
            select_party.appendChild(new_option);
        };
        // enable dropdown menu and add listener to button
        document.getElementById('select_party').disabled = false;
        document.getElementById('button_filter_party').addEventListener('click', show_result);
    };
}

// helper result line
function assemble_result_line(match, one, two, three) {
    var value = '<li><strong><em>';
    value += escapeHtml(one);
    value += '<span class="plus"> + </span>';
    value += escapeHtml(two);
    // if "third" argument not existing
    if (typeof three != 'undefined') {
        value += '<span class="plus"> + </span>';
        value += escapeHtml(three);
    };
    value += '</em></strong>: ';
    value += '<span class="points">' + match + '</span>';
    value += '/' + statements + ' Punkten</li>';
    return value;
}

// show coalitions and their results
function show_result() {
    // disable filter button until finished
    document.getElementById('button_filter_party').disabled = true;
    // not all files loaded correctly, so show error
    if (party === null
            || opinion === null) {
        show_error(null);
    } else {
        // enable election loading button only when party and opinion finished loading as well
        document.getElementById('button_load_election').disabled = false;
        // do counting magic
        statements = opinion.length/party.length;
        calculate_result();
        // sort parties by their result (top down)
        coalition.sort(function(a, b) { 
            return b.match - a.match;
        });
        
        // read out applied filter
        var filter = document.getElementById('select_party').value;
        
        // read out coalition size to show (0 = all)
        var selector = 'input[name="coalition_size"]:checked';
        var coalition_size = document.querySelector(selector);
        
        // create numbered list and add all coalitions matching the filter
        var result = '<ol type="1">';
        for (var i = 0; i < coalition.length; i++) {
            if (coalition[i].third != null) {
                // skip results of coalitions with 3 parties
                // when radio box only wants to see 2 party coalitions
                if (parseInt(coalition_size.value) === 2) {
                    continue;
                };
                if ((filter === allparties)
                        || (filter === coalition[i].first.name)) {
                    result += assemble_result_line(coalition[i].match,
                                                   coalition[i].first.name,
                                                   coalition[i].second.name,
                                                   coalition[i].third.name);
                } else if (filter === coalition[i].second.name) {
                    result += assemble_result_line(coalition[i].match,
                                                   coalition[i].second.name,
                                                   coalition[i].first.name,
                                                   coalition[i].third.name);
                } else if (filter === coalition[i].third.name) {
                    result += assemble_result_line(coalition[i].match,
                                                   coalition[i].third.name,
                                                   coalition[i].first.name,
                                                   coalition[i].second.name);
                };
            } else {
                // skip results of coalitions with 2 parties
                // when radio box only wants to see 3 party coalitions
                if (parseInt(coalition_size.value) === 3) {
                    continue;
                };
                if ((filter === allparties)
                        || (filter === coalition[i].first.name)) {
                    result += assemble_result_line(coalition[i].match,
                                                   coalition[i].first.name,
                                                   coalition[i].second.name);
                } else if (filter === coalition[i].second.name) {
                    result += assemble_result_line(coalition[i].match,
                                                   coalition[i].second.name,
                                                   coalition[i].first.name);
                };
            };
        };
        result += '</ol>';
        document.getElementById('result_election').innerHTML = result;
        
        // enable filter button
        document.getElementById('button_filter_party').disabled = false;
    };
    
    // enable election loading button only when overview finished loading as well
    if (overview_loaded) {
        document.getElementById('button_load_election').disabled = false;
    };
    
    // go to the top where the result is displayed
    window.scrollTo(0, 0);
}

function callback_load_list(object) {
    show_list(object);
}

function callback_load_overview(object) {
    overview = object;
    show_header();
    overview_loaded = true;
}

function callback_load_party(object) {
    party = object;
    show_filter();
    if (opinion_loaded) {
        show_result();
    };
    party_loaded = true;
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
    
    load_result();
}

function load_result() {
    // do not load json if already loaded
    if (party !== null && opinion !== null) {
        show_result();
    } else {
        reset_result();
        coalition = null;
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
