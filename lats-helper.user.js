// ==UserScript==
// @name           LATS Helper
// @namespace      https://chrome.google.com/webstore/detail/lats-helper/jmkgmheopekejeiondjdokbdckkeikeh?hl=en
// @include        https://oftlats.cma.com/*
// @include        https://*.lats.ny.gov/*
// @version        1.0.12
// @updated        2015-07-10
// ==/UserScript==

(function () {
    var path = document.location.pathname
                .replace(/\/Timesheet\//, '')
                .replace(/\.aspx.*/, '');

    /**
     * Searches for matching elements
     * Array version of `querySelectorAll` but as an array
     * @param   {String}  selector  CSS-style selector
     * @param   {Element}  node     Optional element to search within
     * @return  {Array}             Array of matched elements
     */
    var query = function (selector, node) {
            node = node || document;

            return Array.prototype.slice.call(node.querySelectorAll(selector));
        };

    /**
     * Storage API (proxy for `localStorage`)
     * @type  {Object}
     */
    var storage = {
            /**
             * Retrieve a value from storage
             * @param   {String}  key  Key name
             * @return  {Object}       Value, converted from a string
             */
            get: function (key) {
                var value = localStorage.getItem(key),
                    convertedValue;

                if (typeof value === 'string') {
                    try {
                        convertedValue = JSON.parse(value);
                    } catch(e) {
                        convertedValue = value;
                    }
                }
                else {
                    convertedValue = value;
                }

                return convertedValue;
            },

            /**
             * Stores a value
             * @param  {String}  key    Key name
             * @param  {Mixed}  value   Value, must be a string or a JSON-friendly object
             */
            set: function (key, value) {
                if (typeof value !== 'string') {
                    value = JSON.stringify(value);
                }

                return localStorage.setItem(key, value);
            }
        };

    // https://oftlats.cma.com/Timesheet/MyTimesheet.aspx?from=8
    // https://time01.lats.ny.gov/Timesheet/MyTimesheet.aspx?from=8

    /////////////////////////
    // Timesheet Auto-fill //
    /////////////////////////

    /**
     * Timesheet module
     */
    var Timesheet = function Timesheet () {
        // Days:       R  F  M  T  W  R  F   M   T   W
        var dayNums = [0, 1, 4, 5, 6, 7, 8, 11, 12, 13];
        var periods = {
                MorningIn: {
                    label: 'Day in:',
                    val: '',
                    // ,alternates: ['4|7:30AM','11|7:30AM'] // Mondays
                },
                LunchOut: {
                    label: 'Lunch begin:',
                    val: '12:00PM'
                    // ,alternates: ['4|11:30AM','11|11:30AM']
                },
                LunchIn: {
                    label: 'Lunch end:',
                    val: '12:30PM'
                    // ,alternates: ['4|12:00PM','11|12:00PM']
                },
                NightOut: {
                    label: 'Day out:',
                    val: ''
                    // ,alternates: ['4|3:30PM','11|3:30PM']
                }
            };
        var timeSheetSettings = {
                onlyBlankDays: true
            };
        // Simple proxy for the storage proxy
        var store = {
                save: function (val) {
                    return storage.set('timeSheetSettings', val);
                },
                retrieve: function () {
                    return storage.get('timeSheetSettings');
                }
            };
        var controls;
        var button;

        /**
         * Initalize module and UI
         */
        function init() {
            var i;
            var label;
            var input;
            var flagWrapper;
            var buttonWrapper;
            var closeButton;
            var storedSettings = store.retrieve();

            // Make sure it's not an approval screen
            if (document.getElementById('ctl00_ContentPlaceHolder1_btnApprove')) {
                return;
            }

            // Read stored settings
            if (storedSettings) {
                timeSheetSettings = storedSettings;
            }
            else {
                // Save settings for next time
                // This will also fill in any new options introduced since the user last used the extension
                store.save(timeSheetSettings);
            }

            // Get periods from local store
            getStoredPeriods();

            // Create container for all controls
            controls = document.createElement('div');
            controls.style.cssText = 'position: absolute;' +
                                     'top: 10px;' +
                                     'right: 10px;' +
                                     'padding: 10px;' +
                                     'background: white;' +
                                     'width: 270px;' +
                                     'border: 1px solid #555;' +
                                     'box-shadow: 1px 1px 4px #555;';
            controls.innerHTML = '<p><strong>Autofill timesheet</strong></p>';
            document.body.appendChild(controls);

            /////////////////
            // Time inputs //
            /////////////////

            // Add inputs
            for (i in periods) {
                if (periods.hasOwnProperty(i)) {
                    label = document.createElement('label');
                    label.setAttribute('for', i);
                    label.setAttribute('tabindex', '1');
                    label.innerHTML = periods[i].label;
                    label.style.cssText = 'display: inline-block;' +
                                          'width: 90px;' +
                                          'height: 22px;';
                    controls.appendChild(label);

                    input = document.createElement('input');
                    input.type = 'text';
                    input.id = i;
                    input.setAttribute('tabindex', '1');
                    input.style.borderWidth = '1px';
                    input.style.borderStyle = 'solid';

                    if (periods[i].val) {
                        input.value = periods[i].val;
                    }

                    input.addEventListener('keyup', onPeriodKeyup);
                    input.addEventListener('blur', onPeriodBlur);
                    controls.appendChild(input);

                    controls.appendChild(document.createElement('br'));
                }
            }

            ///////////
            // Flags //
            ///////////

            // Flags wrapper
            flagWrapper = document.createElement('div');
            flagWrapper.style.cssText = 'margin: 10px auto 0 auto;' +
                                          'overflow: hidden';
            controls.appendChild(flagWrapper);

            // "Only bank days" flag, check box
            input = document.createElement('input');
            input.type = 'checkbox';
            input.id = 'onlyBlankDays';
            input.addEventListener('change', onOnlyBlankDaysClick);
            input.setAttribute('tabindex', '1');
            input.style.cssText = 'float: left;' +
                                   'color: #fff;' +
                                   'border-color: #4cae4c;';

            // Set check box checked state
            if (timeSheetSettings.onlyBlankDays) {
                input.setAttribute('checked', 'checked');
            }

            flagWrapper.appendChild(input);

            // "Only bank days" flag, label
            label = document.createElement('label');
            label.setAttribute('for', 'onlyBlankDays');
            label.setAttribute('tabindex', '1');
            label.innerHTML = 'Only fill in days with no entries';
            label.style.cssText = 'display: inline-block;' +
                                  'font-size: 12px;' +
                                  'width: 200px;' +
                                  'height: 22px;';
            flagWrapper.appendChild(label);

            /////////////
            // Buttons //
            /////////////

            // Button wrapper
            buttonWrapper = document.createElement('div');
            buttonWrapper.style.cssText = 'margin: 10px auto 0 auto;' +
                                          'overflow: hidden';
            controls.appendChild(buttonWrapper);

            // Apply button
            button = document.createElement('button');
            button.type = 'button';
            button.innerHTML = 'Apply';
            button.addEventListener('click', onButtonClick);
            button.setAttribute('tabindex', '1');
            button.style.cssText = 'float: left;' +
                                   'color: #fff;' +
                                   'background-color: #5cb85c;' +
                                   'border-color: #4cae4c;';
            buttonWrapper.appendChild(button);

            // Add button
            closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.innerHTML = 'Close';
            closeButton.addEventListener('click', onCloseButtonClick);
            closeButton.setAttribute('tabindex', '1');
            closeButton.style.cssText = 'float: right;';
            buttonWrapper.appendChild(closeButton);

            // Make all input fields updateable (normally, future dates are readonly)
            query('#ctl00_ContentPlaceHolder1_TimesheetGridTable input[readonly="readonly"][type="text"]')
                .forEach(function (input){
                    input.removeAttribute('readonly');
                });
        }

        // Teardown UI
        function onCloseButtonClick(/* evt */) {
            // Remove the UI
            controls.parentNode.removeChild(controls);
        }

        function getStoredPeriods(/* storedPeriods */) {
            var local = storage.get('periods');

            // Update cache with stored value
            if (local && typeof local === 'object' && local.hasOwnProperty('MorningIn')) {
                periods = local;
            }
            // Nothing valid was stored yet, so add the default
            else {
                storage.set('periods', periods);
            }
        }

        // Store the value as it's typed
        function onPeriodKeyup(evt) {
            var input = evt.target;
            var id = input.id;
            var val = formatTime(input.value);

            if (val) {
                // Store the value if it's valid
                changePeriod(id, val);
                input.style.borderColor = 'green';
            }
            else {
                // Let the user know the value is not (yet) in a valid format
                input.style.borderColor = 'maroon';
            }
        }

        // Format the value
        function onPeriodBlur (evt) {
            var input = evt.target;
            var id = input.id;
            var val = formatTime(input.value);

            if (val) {
                // Format the input field
                input.style.borderColor = 'green';

                // Store the value
                changePeriod(id, val);
            }
            else {
                input.style.borderColor = 'maroon';
            }
        }

        function formatTime (val) {
            var hhmmPattern = /^(\d+)\:(\d\d)\s*(\w+)?$/; // HH:MM
            var noColonPattern = /^(\d{3,4})\s*(\w+)?$/;  // HMM or HMM
            var shorthandPattern = /^(\d{1,2})\s*([ap])?m?$/; // HHpm (which equates to HH:00 PM)
            var parts;
            var hour;
            var hourNum;
            var minute;
            var suffix;

            val = val.trim();

            // Hp shorthand format
            if (shorthandPattern.test(val)) {
                parts = shorthandPattern.exec(val);
                hour = parts[1];
                minute = '00';

                if (parts[2]) {
                    suffix = parts[2];
                }
            }
            // HH:MM format
            else if (hhmmPattern.test(val)) {
                parts = hhmmPattern.exec(val);
                hour = parts[1];
                minute = parts[2];

                if (parts[3]) {
                    suffix = parts[3];
                }
            }
            // HHMM format (no colon)
            else if (noColonPattern.test(val)) {
                parts = noColonPattern.exec(val);

                if (parts[2]) {
                    suffix = parts[2];
                }

                // Create an array of the three or four digits
                parts = parts[1].split('');

                // We don't know if the user had one or two digits for the hour, but the minute must be the last two digits
                minute = parts.pop();
                minute = parts.pop() + minute;

                // What's left is the hour
                hour = parts.join('');
            }
            else {
                // We have nothing to go by, so just quit
                return '';
            }

            // Normalize prefix
            if (suffix) {
                if (/^p/i.test(suffix)) {
                    suffix = 'PM';
                }
                else if (/^a/i.test(suffix)) {
                    suffix = 'AM';
                }
                else {
                    suffix = '';
                }
            }

            // Use the hours to guess the suffix
            if (!suffix) {
                hourNum = parseInt(hour, 10);

                if (hourNum < 6 || hourNum === 12) {
                    suffix = 'PM';
                }
                else if (!isNaN(hourNum)) {
                    suffix = 'AM';
                }
            }

            // Make sure we have everything
            if (hour && minute && suffix) {
                return hour + ':' + minute + suffix;
            }
            else {
                return '';
            }
        }

        function changePeriod (id, val) {
            if (periods.hasOwnProperty(id) && val) {
                periods[id].val = val;

                storage.set('periods', periods);
            }
        }

        function onButtonClick ( /* evt */ ) {
            fillInValues();
        }

        function onOnlyBlankDaysClick (evt) {
            // Update setting
            timeSheetSettings.onlyBlankDays = evt.target.checked;
            store.save(timeSheetSettings);
        }

        // Populate the fields on the page
        function fillInValues () {
            var i;
            var j;
            var id;
            var val;

            i = dayNums.length;
            while (i--) {
                // Make sure the day is completely empty so we don't overwrite any user-entered values
                if (timeSheetSettings.onlyBlankDays && !isDayBlank(dayNums[i])) {
                    continue;
                }

                // Loop through stored values
                for (j in periods) {
                    // val = '';
                    //
                    // if (periods[j].alternates) {
                    //     k = periods[j].alternates.length;
                    //
                    //     while (k--) {
                    //         alt = periods[j].alternates[k].split('|');
                    //
                    //         if (parseInt(alt[0], 10) === dayNums[i]) {
                    //             val = alt[1];
                    //             break;
                    //         }
                    //     }
                    // }
                    //
                    // If `val` wasn't populated by an alternate
                    // if (!val) {
                        val = periods[j].val;
                    // }

                    // Make sure we have a value (i.e. field wasn't blank)
                    if (val) {
                        id = 'ctl00_ContentPlaceHolder1_TSData' + j + 'DArr' + dayNums[i];

                        // Apply value
                        try {
                            document.getElementById(id).value = val;
                        } catch (e) { }
                    }
                }
            }
        }

        // Determines if a day has no time filled in yet
        function isDayBlank(day) {
            var numEmpty = 0;
            // var dayNum = dayNums[day]; // Suffix of the element ID
            var id;
            var j;

            // Loop through stored values
            for (j in periods) {
                id = 'ctl00_ContentPlaceHolder1_TSData' + j + 'DArr' + day;

                // Check for a value
                if (document.getElementById(id).value.trim().length) {
                    numEmpty++;
                }
            }

            return numEmpty === 0;
        }

        // Run the module
        init();
    } // end Timesheet

    ///////////////////////
    // Sub Task Selector //
    ///////////////////////

    /**
     * SubTasks module
     */
    var SubTasks = function SubTasks () {
        var subTaskDropdown = document.querySelector('select[title="Sub Tasks"]');
        var subTaskOptions = [].slice.call(subTaskDropdown.options);
        var insertionPoint = document.querySelector('.inputTable'); // This is the gray area in the UI; put new elements directly after this
        var controls = document.createElement('div');
        var searchLabel = document.createElement('label');
        var searchBox = document.createElement('input');
        var clusterLabel = document.createElement('label');
        var clusterMenu = document.createElement('select');
        var agencyMenu = document.createElement('select');
        var agencyLabel = document.createElement('label');
        var items = [];
        var list;
        var subTaskSettings = {
                cluster: '',
                agency: ''
            };
        // Simple proxy for the storage proxy
        var store = {
                save: function (val) {
                    return storage.set('subTaskSettings', val);
                },
                retrieve: function () {
                    return storage.get('subTaskSettings');
                }
            };
        // List of agencies for each cluster
        var clusters = [
                { name: 'AGS',
                  agencies: ['DCS', 'DOB', 'DVA', 'OER', 'OGS']},
                { name: 'DAC',
                  agencies: ['NJC','OAS','OFA','OPW','OPW','QOC']},
                { name: 'EEC',
                  agencies: ['AGM', 'AGR', 'APA', 'APA', 'DEC', 'DPS', 'ITS', 'OPR', 'OPR']},
                { name: 'ENT_ITS',
                  agencies: ['CIO', 'HSEN', 'IBM', 'OFT', 'SNC']},
                { name: 'FRG',
                  agencies: ['DCS', 'DFS', 'DOB', 'DTA', 'DTF', 'GOV', 'NGC', 'OGS']},
                { name: 'GGC',
                  agencies: ['BOE', 'DMV', 'DOS', 'JCP', 'SLA', 'WCB']},
                { name: 'HLT',
                  agencies: ['DOH', 'MIG', 'OAS', 'OMH']},
                { name: 'HSC',
                  agencies: ['CFS', 'DHR', 'DOL', 'HES', 'TDA']},
                { name: 'PSC',
                  agencies: ['COC', 'DCC', 'DCJ', 'DHS', 'DSP', 'OVS', 'PDV']},
                { name: 'TED',
                  agencies: ['DOT', 'ESD', 'HCR']}
            ];

        /**
         * Initializes module and the UI
         */
        function init() {
            var storedSettings;

            // Check if a task was just added
            if (document.querySelectorAll('#ctl00_ContentPlaceHolder1_UpdatePanel2, [name="ctl00$ContentPlaceHolder1$btnClose"]').length > 1 && document.getElementById('ctl00_ContentPlaceHolder1_UpdatePanel2').innerHTML.indexOf('Sub Task was successfully added.') !== -1) {
                // Auto-close popup
                document.querySelector('[name="ctl00$ContentPlaceHolder1$btnClose"]').click();

                // Don't do any more costly rendering since the popup will now close
                return true;
            }

            // Read stored settings
            storedSettings = store.retrieve();

            if (storedSettings) {
                subTaskSettings = storedSettings;
            }
            else {
                // Save default settings for next time
                // This will also fill in any new options introduced since the user last used the extension
                store.save(subTaskSettings);
            }

            // Container for controls
            controls.style.cssText = 'padding: 10px;';
            insertionPoint.parentNode.insertBefore(controls, insertionPoint.nextSibling);

            // Search
            searchLabel.innerHTML = 'Filter:';
            searchLabel.style.cssText = 'display: inline-block; padding-right: 5px;';
            searchLabel.setAttribute('for', 'searchBox');

            searchBox.type = 'text';
            searchBox.id = 'searchBox';
            searchBox.style.cssText = 'display: inline-block; margin-right: 10px;';
            searchBox.setAttribute('tabindex', '1');
            searchBox.addEventListener('keyup', onSearchKeyup, false);

            controls.parentNode.insertBefore(searchLabel, controls.nextSibling);
            controls.parentNode.insertBefore(searchBox, searchLabel.nextSibling);

            ////////////////////////
            // Cluster and agency //
            ////////////////////////

            // Create elements
            clusterLabel.innerHTML = 'Cluster:';
            clusterLabel.setAttribute('for', 'clusterMenu');

            clusterMenu.id = 'clusterMenu';
            clusterMenu.setAttribute('tabindex', '1');

            agencyLabel.innerHTML = 'Agency:';
            agencyLabel.setAttribute('for', 'agencyMenu');
            agencyLabel.style.cssText = 'display: inline-block; padding-left: 10px;';

            agencyMenu.id = 'agencyMenu';
            agencyMenu.setAttribute('tabindex', '1');

            buildDropdowns(subTaskSettings.cluster, subTaskSettings.agency);

            // Events
            clusterMenu.addEventListener('change', onDropdownChange, false);
            agencyMenu.addEventListener('change', onDropdownChange, false);

            // Add elements to the page
            searchBox.parentNode.insertBefore(clusterLabel, searchBox.nextSibling);
            searchBox.parentNode.insertBefore(clusterMenu, clusterLabel.nextSibling);
            searchBox.parentNode.insertBefore(agencyLabel, clusterMenu.nextSibling);
            searchBox.parentNode.insertBefore(agencyMenu, agencyLabel.nextSibling);

            createTaskList();
        }

        /**
         * Handles clicks on a task item
         * @param   {Event}  evt  Click event
         */
        function onItemClick(evt) {
            var item = evt.target;
            var value = item.getAttribute('data-value');

            // Change dropdown
            subTaskDropdown.value = value;

            // Add the task
            document.querySelector('input[value="Add"]').click();
        }

        /**
         * When the user types a filter/search query
         *
         * @param   {Event}  evt   Keyup event
         */
        function onSearchKeyup(evt) {
            filterBySearchQuery();
        }

        /**
         * Determine the new preferences when either the cluster or agency menus change
         *
         * @param   {Event}  evt   Change event
         */
        function onDropdownChange(evt) {
            var select = evt.target;
            var prefName = select.id.replace(/Menu$/, '');
            var name = select.options[select.selectedIndex].value;
            var bFound = false;
            var targetCluster;
            var targetAgency;

            // Update setting
            subTaskSettings[prefName] = name;
            store.save(subTaskSettings);

            // Find new target cluster and target agency

            // A cluster was just chosen
            if (prefName === 'cluster') {
                targetCluster = name;
                targetAgency = subTaskSettings.agency;

                // Make sure the stored agency preference is actually in this cluster
                if (targetAgency) {
                    clusters.forEach(function (cluster) {
                        if (cluster.name === targetCluster) {
                            // Agency loop
                            cluster.agencies.forEach(function (agency) {
                                if (agency === targetAgency) {
                                    bFound = true;
                                }
                            });
                        }
                    });

                    if (!bFound) {
                        // Remove agency preference since it's invalid
                        targetAgency = '';

                        // Update storage
                        subTaskSettings.agency = '';
                        store.save(subTaskSettings);
                    }
                }
            }
            // An agency was just chosen
            else if (prefName === 'agency') {
                targetAgency = name;

                // Figure out which cluster(s) are acceptable to be shown in the menu
                targetCluster = [];

                // Find all clusters that this agency is part of
                clusters.forEach(function (cluster) {
                    cluster.agencies.forEach(function (agency) {
                        if (agency === targetAgency) {
                            targetCluster.push(cluster.name);
                        }
                    });
                });

                // See if an acceptable cluster is already selected
                if (targetCluster.indexOf(clusterMenu.options[clusterMenu.selectedIndex].innerHTML) === -1) {

                    // Find the target option and select it
                    bFound = false;
                    [].slice.call(clusterMenu.options).forEach(function (opt) {
                        if (!bFound && targetCluster.indexOf(opt.innerHTML) !== -1) {
                            // Stop at the first one found, I guess
                            bFound = true;
                            targetCluster = opt.innerHTML;
                        }
                    });

                    if (typeof targetCluster !== 'string') {
                        // Nothing was found in the loop above, so just pick the first one I guess
                        targetCluster = targetCluster[0];
                    }
                }
                else {
                    // This just chooses the currently-selected cluster from the array of valid choices so `targetCluster` is just a string
                    targetCluster = targetCluster[targetCluster.indexOf(clusterMenu.options[clusterMenu.selectedIndex].innerHTML)];
                }
            }

            // Redraw dropdowns
            buildDropdowns(targetCluster, targetAgency);

            // Redraw list
            recreateTaskList();
        }

        /**
         * Builds the cluster and agency dropdowns based on the specified preferences and selects the appropriate option
         *
         * @param   {String}  targetCluster  Optional preferred cluster; if specified, it will be selected and only its agencies will appear in the agency menu
         * @param   {String}  targetAgency   Optional preferred agency; if specified, it will be selected
         *
         * @return  {Boolean}                Success/failure
         */
        function buildDropdowns(targetCluster, targetAgency) {
            var selectedIndices = [-1, -1];

            // Clear out existing options
            while (clusterMenu.firstChild) {
                clusterMenu.removeChild(clusterMenu.firstChild);
            }

            while (agencyMenu.firstChild) {
                agencyMenu.removeChild(agencyMenu.firstChild);
            }

            // Add blank entries
            clusterMenu.appendChild(new Option('(All)', ''));
            agencyMenu.appendChild(new Option('(All)', ''));

            // Cluster loop
            clusters.forEach(function (cluster, c) {
                var doAddTheseAgencies = false;

                // Add cluster `<option>`
                clusterMenu.appendChild(new Option(cluster.name, cluster.name));

                // If there's a prefered cluster, only add agencies for that cluster
                if (targetCluster) {
                    if (cluster.name === targetCluster) {
                        selectedIndices[0] = c;
                        doAddTheseAgencies = true;
                    }
                }
                // Otherwise add any cluster's agencies
                else {
                    doAddTheseAgencies = true;
                }

                // Add `<option>` for each agency to the menu
                if (doAddTheseAgencies) {
                    cluster.agencies.forEach(function (agency, a) {
                        if (targetAgency && agency === targetAgency) {
                            selectedIndices[1] = a;
                        }

                        agencyMenu.appendChild(new Option(agency, agency));
                    });
                }
            });

            // Select the preferred indices (add one to compensate for the dummy option)
            clusterMenu.options[selectedIndices[0] + 1].setAttribute('selected', 'selected');
            agencyMenu.options[selectedIndices[1] + 1].setAttribute('selected', 'selected');

            return true;
        }

        /**
         * Create a spelled-out list of tasks
         */
        function createTaskList() {
            var ignorePattern = /\-Select\-/;
            var matchPattern = null;
            var targetCluster = subTaskSettings.cluster;
            var targetAgency = subTaskSettings.agency;

            // Make sure the stored agency preference is actually in this cluster
            if (targetAgency) {
                bFound = false;
                // Cluster loop
                clusters.forEach(function (cluster) {
                    if (cluster.name === targetCluster) {
                        // Agency loop
                        cluster.agencies.forEach(function (agency) {
                            if (agency === targetAgency) {
                                bFound = true;
                            }
                        });
                    }
                });

                if (!bFound) {
                    // Remove agency preference since it's invalid
                    targetAgency = '';

                    // Update storage
                    subTaskSettings.agency = '';
                    store.save(subTaskSettings);
                }
            }

            // Create prefs patterns for matching
            // Cluster and agency
            if (targetCluster && targetAgency) {
                matchPattern = new RegExp('^' + targetCluster + '_' + targetAgency + '_');
            }
            // Cluster only
            else if (targetCluster && !targetAgency) {
                matchPattern = new RegExp('^' + targetCluster + '_');
            }
            // Agency only
            else if (!targetCluster && targetAgency) {
                // Cluster could be `AAA` or `AAA_BBB`
                matchPattern = new RegExp('^\\w{3}_(\\w{3}_)?' + targetAgency + '_');
            }


            list = document.createElement('ul');
            list.style.cssText = 'list-style: none outside none;';

            subTaskOptions.forEach(function (opt) {
                var text = opt.getAttribute('title');
                var li;

                if (ignorePattern.test(text)) {
                    return false;
                }

                // Test against user prefs
                if (matchPattern) {
                    if (!matchPattern.test(text)) {
                        return false;
                    }
                    else {
                        //TODO: grey out the cluster/agency portion. It's too confusing to simply strip it because many options begin with some other ABC_ prefix that looks like an agency or cluster code.
                        // text = text.replace(matchPattern, '');
                    }
                }

                li = document.createElement('li');
                li.style.cssText = 'display: block; cursor: pointer;';
                li.innerHTML = text;
                li.setAttribute('data-value', opt.value);
                li.addEventListener('click', onItemClick, false);

                // Add to page
                list.appendChild(li);

                // Cache
                items.push(li);
            });

            insertionPoint.parentNode.appendChild(list);

            // Apply current user-enter filter, if applicable
            if (searchBox.value) {
                filterBySearchQuery();
            }

            searchBox.focus();
        }

        /**
         * Destroy and re-create the list of tasks
         */
        function recreateTaskList() {
            // Empty cache
            items = [];

            // Remove elements
            list.parentNode.removeChild(list);

            // Re-create list
            createTaskList();
        }

        /**
         * Hide and show tasks based on the user-entered search term
         */
        function filterBySearchQuery() {
            var q = searchBox.value.trim().toLowerCase();

            // Hide and show items that match the query
            items.forEach(function (item) {
                if (item.innerHTML.toLowerCase().indexOf(q) !== -1) {
                    item.style.display = 'block';
                }
                else {
                    item.style.display = 'none';
                }
            });
        }

        // Initialize immediately since this script is being loaded when the document is ready
        init();
    } // end SubTasks

    /**
     * TDS module
     */
    function TDS () {
        var styleElem;

        function init() {
            // Increase the table size
            addStyle('#ctl00_ContentPlaceHolder1_pnlTDSData' +
                '{ width: 782px !important; height: auto !important; }');

            // Smaller task names
            addStyle('td[colspan="14"] span' +
                '{ font-size: 12px; font-weight: normal !important; }');

            // Subdued task names
            addStyle(
                '#ctl00_ContentPlaceHolder1_TDSData tr:nth-child(2n+1) {' +
                    'font-weight: normal;' +
                    'font-size: 12px;' +
                '}'
            );

            // Bigger sub-task names
            addStyle('td[colspan="14"] a' +
                '{ display: block; font-size: 16px; font-weight: bold; color: #039; }');

            // Better table colors
            addStyle('tr[style="background-color:#CCCCCC;"]' +
                '{ background-color: #fff !important; }');
            addStyle('tr[style="background-color:#CCCCCC;"] td' +
                '{ border-top: 1px solid #aaa; }');

            // Blank out weekends
            addStyle('#ctl00_ContentPlaceHolder1_TDSData tbody tr td:nth-child(4),' +
                    '#ctl00_ContentPlaceHolder1_TDSData tbody tr td:nth-child(5),' +
                    '#ctl00_ContentPlaceHolder1_TDSData tbody tr td:nth-child(11),' +
                    '#ctl00_ContentPlaceHolder1_TDSData tbody tr td:nth-child(12),' +
                    '#ctl00_ContentPlaceHolder1_HeaderDisplay tbody tr td:nth-child(4),' +
                    '#ctl00_ContentPlaceHolder1_HeaderDisplay tbody tr td:nth-child(5),' +
                    '#ctl00_ContentPlaceHolder1_HeaderDisplay tbody tr td:nth-child(11),' +
                    '#ctl00_ContentPlaceHolder1_HeaderDisplay tbody tr td:nth-child(12),' +
                    '#ctl00_ContentPlaceHolder1_FooterDisplay tbody tr td:nth-child(4),' +
                    '#ctl00_ContentPlaceHolder1_FooterDisplay tbody tr td:nth-child(5),' +
                    '#ctl00_ContentPlaceHolder1_FooterDisplay tbody tr td:nth-child(11),' +
                    '#ctl00_ContentPlaceHolder1_FooterDisplay tbody tr td:nth-child(12)' +
                    '{ opacity: 0.25; }');
        }

        /**
         * Add a CSS style to the document
         * @param  {String}  rule  Complete CSS selector and style definition block
         */
        function addStyle(rule) {
            if (!document.styleSheets || typeof rule !== 'string') { return false; }

            // The first time this function is called, a new <style> block must be created
            if (!styleElem) {
                styleElem = document.createElement('style');
                styleElem.type = 'text/css';
                document.documentElement.appendChild(styleElem);
            }

            // Add rules to the style sheet
            styleElem.appendChild(document.createTextNode(' ' + rule));
        }

        init();
    }

    //////////////////////////////
    // Immediate initialization //
    //////////////////////////////

    // Run the appropriate module
    if (path === 'MyTimesheet') {
        Timesheet();
    }
    else if (path === 'SubTasks') {
        SubTasks();
    }
    else if (path === 'TDS') {
        TDS();
    }
}());
