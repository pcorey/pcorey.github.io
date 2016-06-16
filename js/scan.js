$(function() {

  $.getJSON("https://raw.githubusercontent.com/East5th/package-scan/master/data/alerts.json", undefined, function(res) {
    alerts = res;
  });

  $('#file-select').on("change", function(e) {
    getResults(this.files[0]);
  });

  $('.drop-target').on("dragover dragenter drop", function(e) {
    e.preventDefault();
  }).on("drop", function(e) {
    e.preventDefault();
    $('#file-select').prop("files", e.originalEvent.dataTransfer.files);
    return false;
  });

  $(".go-again").on("click", function(e) {
    e.preventDefault();
    reset();
    return false;
  });

  $(".show-sample").on("click", function(e) {
    e.preventDefault();
    showSample();
    return false;
  });

});

function processLine(line) {
  line = line.trim();
  if (line.length) {
    var split = line.split('@');
    return {
      name: split[0],
      version: split[1]
    };
  }
}

function getResults(file) {
  var reader = new FileReader();
  var packages = [];
  var results = [];
  reader.onload = (function(file) {
    return function(e) {
      var text = e.target.result;
      var lines = text.split(/\r?\n/);
      lines.forEach(function(line) {
        var package = processLine(line);
        if (package) {
          packages.push(package);
        }
      });
      packages.forEach(function(package) {
        (alerts[package.name] || []).forEach(function(alert) {
          if (semver.satisfies(package.version, alert.range)) {
            results.push({
              package: package,
              alert: alert
            });
          }
        });
      });
      showAlerts(results);
    }
  })(file);
  if (file) {
    reader.readAsText(file);
  }
}

function reset() {
  $('.drop-target').removeClass('good');
  $('.drop-target').removeClass('bad');
  $('.results .bad').hide();
  $('.results .good').hide();
  $('.drop-target .prompt').show();
  $('.go-again').hide();
}

function buildAlert(alert) {
  /*
  <div class="result">
    <p>
      <code class="package" title="Installed package">telescope:core@0.20.0</code>
      <code class="versions" title="Vulnerable versions">>=0.2.0 || <=0.21.1</code>
    </p>
    <p class="alert">This version of Telescope is vulnerable to a privilege escalation attack.</p>
    <p class="links">More info:</p>
    <ul>
      <li><a href="https://github.com/TelescopeJS/Telescope/blob/master/History.md#v0211-slugscope" target="_blank">Github Issue</a></li>
    </ul>
  </div>
  */
  var result = $('<div class="result"></div>');
  var line = $('<p>');
  line.append($('<code class="language-javascript package" title="Installed Package">').text(alert.package.name+'@'+alert.package.version));
  line.append($('<code class="language-javascript versions" title="Vulnerable Versions">').text(alert.alert.range));
  result.append(line);
  result.append($('<p class="alert">').text(alert.alert.alert));
  if (alert.alert.links && alert.alert.links.length) {
    result.append($('<p class="links">More info:</p>'));
    var ul = $('<ul>');
    alert.alert.links.forEach(function(link) {
      ul.append($('<li>').append($('<a href="'+link.url+'" target="_blank">'+link.name+'</a>')));
    });
    result.append(ul);
  }
  return result;
}

function showAlerts(alerts, counted) {
  $('.drop-target .prompt').hide();
  if (alerts && alerts.length) {
    var results = $('.results .bad .result-list').empty();
    alerts.forEach(function(alert) {
      results.append(buildAlert(alert));
    });
    $('.drop-target').removeClass('good');
    $('.drop-target').addClass('bad');
    $('.results .bad').show();
    $('.results .good').hide();
  }
  else {
    $('.drop-target').removeClass('bad');
    $('.drop-target').addClass('good');
    $('.results .bad').hide();
    $('.results .good').show();
  }
  $('.go-again').show();
}

function showSample() {
  showAlerts([
    {
      alert: {
        alert: "This package is not appropriate for use in production applications!",
        range: "*"
      },
      package: {
        name: "insecure",
        version: "1.0.4"
      }
    },
    {
      alert: {
        alert: "Exposes a method that lets users modify any collection.",
        range: "< 1.24.3"
      },
      package: {
        name: "example:package",
        version: "1.24.2"
      }
    }
  ]);
}
