/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


// Create namespace
if (typeof Mozilla === 'undefined') {
  var Mozilla = {};
}

(function() {
  'use strict';

  const DownloadInfo = {};

  const isDownloadPage = document.getElementsByClassName('page-download').length > 0;
  let localeSelect = document.getElementById('download-language-select');
  let channelSelect = document.getElementById('download-release-select');
  let osSelect = document.getElementById('download-os-select');
  let installerSelect = document.getElementById('download-advanced-platform-select');
  let downloadButton = document.getElementById('download-btn');
  let defaultOS = 'Windows';
  let defaultReleaseChannel = 'release';

  /**
   * Hooks up onChange event handlers, and sets the installer dropdown options / download link
   */
  DownloadInfo.Init = function() {
    // We only have to check for one of these dropdowns.
    if (!isDownloadPage || !channelSelect) {
      return;
    }

    // Check to see if we want to show a different release channel on load
    const regex = /\/download\/(beta|daily)\/?$/gm;
    const url = new URL(location.href);
    const overrideReleasePath = regex.exec(url.pathname)

    // Check for ?release=<channel> or /download/<channel>
    let overrideRelease = url.searchParams.get('release');
    if (!overrideRelease && overrideReleasePath) {
      overrideRelease = overrideReleasePath[1];
    }

    if (['release', 'beta', 'daily'].indexOf(overrideRelease) !== -1) {
      defaultReleaseChannel = overrideRelease;
      DownloadInfo.ToggleDailyWarning(defaultReleaseChannel);
    }

    channelSelect.addEventListener('change', function(event) {
      DownloadInfo.ToggleDailyWarning(event.currentTarget.value);
    });
    osSelect.addEventListener('change', function(event) {
      DownloadInfo.OnOSSelection(event.currentTarget.value);
    });
    [localeSelect, channelSelect, osSelect, installerSelect].forEach(function(element) {
      element.addEventListener('change', function(event) {
        DownloadInfo.SetDownloadLink();
      });
    });

    // Set some defaults
    DownloadInfo.SetDefaults();
  }

  DownloadInfo.SetDefaults = function () {
    const platform = window.site.getPlatform();

    // Okay we need to work our way backwards...
    const platformMap = {
      'win64': 'Windows',
      'msi': 'Windows',
      'win': 'Windows',
      'linux64': 'Linux',
      'linux': 'Linux',
      'osx': 'MacOS',
      //'android': 'Android'
    };

    // Setup download link
    DownloadInfo.Update();

    defaultOS = platformMap[platform] ?? defaultOS;
    channelSelect.value = defaultReleaseChannel;

    // Channel Selection calls OS Selection
    DownloadInfo.OnOSSelection(defaultOS);
    DownloadInfo.SetDownloadLink();
  }

  /**
   * We could keep state here which can get tricky, or just rely on values.
   */
  DownloadInfo.Update = function() {
    localeSelect = document.getElementById('download-language-select');
    channelSelect = document.getElementById('download-release-select');
    osSelect = document.getElementById('download-os-select');
    installerSelect = document.getElementById('download-advanced-platform-select');
    downloadButton = document.getElementById('download-btn');
  };

  /**
   * Selects a specific entry from the OS Selection
   * @param os {string}
   */
  DownloadInfo.OnOSSelection = function(os) {
    osSelect.value = os;

    let firstInstaller = null;

    document.querySelectorAll('[data-for-os]').forEach(function (element) {
      if (element.dataset.forOs === os) {
        element.classList.remove('hidden');
        if (!firstInstaller) {
          firstInstaller = element.value;
        }
      } else {
        element.classList.add('hidden');
      }
    });

    if (firstInstaller) {
      installerSelect.value = firstInstaller;
    }
  }

  /**
   * Hides/Shows daily warning
   * @param channel {string}
   */
  DownloadInfo.ToggleDailyWarning = function(channel) {
    const dailyWarning = document.getElementById('daily-warning');

    if (channel === 'daily') {
      dailyWarning.classList.remove('hidden');
    } else {
      dailyWarning.classList.add('hidden');
    }
  }

  /**
   * Actually set the download link from the current options
   * @constructor
   */
  DownloadInfo.SetDownloadLink = function() {
    downloadButton.href = DownloadInfo.DownloadLink(localeSelect.value, channelSelect.value, osSelect.value, installerSelect.value);
  }

  /**
   * Generate the download link from the given parameters
   * @param locale {string} - Locale code (e.g. 'fr' or 'en-CA')
   * @param channel {string} - Channel code for the build (e.g. 'release' or 'beta')
   * @param os {string} - OS for the build. Only used for android.
   * @param installer {string} - Platform code for the build (e.g. 'win64' or 'linux64')
   * @returns {string} - Formulated download link or redirect link depending on the platform vs options
   */
  DownloadInfo.DownloadLink = function(locale, channel, os, installer) {
    if (os === 'Android') {
      switch(installer) {
        case 'gplay':
          return 'https://play.google.com/store/apps/details?id=com.fsck.k9';
        case 'fdroid':
          return 'https://f-droid.org/packages/com.fsck.k9/';
        case 'apk':
          return 'https://github.com/thunderbird/thunderbird-android/releases';
        default:
          return 'https://play.google.com/store/apps/details?id=com.fsck.k9';
      }
    }

    // For release channel just pull from the hidden no-js section.
    if (channel === 'release') {
      const link = document.querySelector(`[data-download-locale="${locale}"][data-download-version="${installer}"]`)?.href;
      // Ensure it's actually a download.mozilla.org link!
      if (link && link.indexOf('https://download.mozilla.org/') === 0) {
        return link;
      }
    }

    // Download links are sleepier than they appear.
    // download.mozilla.org uses the term nightly, while we use daily.
    if (channel === 'daily') {
      channel = 'nightly';
    }

    const channelVersion = channel === 'release' ? `latest` : `${channel}-latest`;
    return `https://download.mozilla.org/?product=thunderbird-${channelVersion}-SSL&os=${installer}&lang=${locale}`
  }

  window.Mozilla.DownloadInfo = DownloadInfo;

  document.addEventListener('DOMContentLoaded', function() {
    DownloadInfo.Init();
  });
})();