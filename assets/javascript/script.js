// First we get the viewport height and we multiple it by 1% to get a value for a vh unit
let vh = window.innerHeight * 0.01;
// Then we set the value in the --vh custom property to the root of the document
document.documentElement.style.setProperty('--vh', `${vh}px`);

const now = new Date();
const day_list = ['日', '一', '二', '三', '四', '五', '六'];

// main time
$(function getTime() {
    let week = now.getDay();
    let weekZH = '週' + day_list[week];

    let month = now.getMonth() + 1;
    let date = now.getDate();
    let today = month + '/' + date;

    print = `
	<h3>${weekZH}</h3>
	<h3>${today}</h3>
	`;
    $('.date_container').html(print);
});

// get geolocation
var option = {
    enableAcuracy: false,
    maximumAge: 0,
    timeout: 600000,
};
navigator.geolocation.getCurrentPosition(successCallback, error);
function error() {
    getCwbApi('063', '信義區');
}

// check the client's county & town
function successCallback(position) {
    let lng = position.coords.longitude;
    let lat = position.coords.latitude;

    if (lng >= 123 || lng <= 118 || lat >= 25 || lat <= 22) {
        lng = 121.53;
        lat = 25.03;
    }

    getLocation = 'https://api.nlsc.gov.tw/other/TownVillagePointQuery/' + lng + '/' + lat + '/4326';
    $.getJSON(getLocation).done(function (clientLocation) {
        for (c = 0; c < countyApi.length; c++) {
            if (clientLocation.ctyName == countyApi[c].name) {
                break;
            }
        }
        clientCountyCode = countyApi[c].apiCode;
        clientLocationTown = clientLocation.townName;
        getCwbApi(clientCountyCode, clientLocationTown);
    });
}

// get the weather API
function getCwbApi(clientCountyCode, clientLocationTown) {
    $.getJSON('https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-093?Authorization=CWB-C67AAE13-37AA-4F9D-892F-E25483690887&locationId=F-D0047-' + clientCountyCode).done(function (CWB) {
        renderCounty(CWB, clientCountyCode, clientLocationTown);
    });
}

// render the county name
function renderCounty(CWB, clientCountyCode, clientLocationTown) {
    AllCounty(CWB);
    changePicture(clientCountyCode);
    getVillage(CWB, clientLocationTown);
}

// add all options of county
function AllCounty(CWB) {
    for (i = 0; i < countyApi.length; i++) {
        let selected = '';
        if (CWB.records.Locations[0].LocationsName == countyApi[i].name) {
            selected = 'selected';
        }

        arrayCounty = `<option value="${countyApi[i].apiCode}" ${selected}>${countyApi[i].name}</option>`;
        $('#locationCounty').children().append(arrayCounty);
    }
}

// change picture
function changePicture(clientCountyCode) {
    for (x = 0; x < countyApi.length; x++) {
        if (countyApi[x].apiCode.includes(clientCountyCode) == true) {
            break;
        }
    }
    print = `
  <div class="picture" style="background-image: url(${countyApi[x].picture})"></div>
`;
    $('.picture_container').html(print);
}

// get the index of selected village
function getVillage(CWB, clientLocationTown) {
    let check = '';

    for (v = 0; v < CWB.records.Locations[0].Location.length; v++) {
        if (clientLocationTown == CWB.records.Locations[0].Location[v].LocationName) {
            check = 1;
            break;
        } else {
            check = 0;
        }
    }
    if (check == 0) {
        v = 0;
    }
    renderVillage(CWB, clientLocationTown, v);
    renderClimate(CWB, v);
}

// render the village name
function renderVillage(CWB, clientLocationTown, v) {
    $('#theVillageSelect').html(print);
    AllVillage(CWB, clientLocationTown);
}

// add all options of village
function AllVillage(CWB, clientLocationTown) {
    for (i = 0; i < CWB.records.Locations[0].Location.length; i++) {
        let selected = '';
        console.log(clientLocationTown == CWB.records.Locations[0].Location[i].LocationName);
        if (clientLocationTown == CWB.records.Locations[0].Location[i].LocationName) {
            selected = 'selected';
        }
        arrayCounty = `
    <option value="${i}" ${selected}>${CWB.records.Locations[0].Location[i].LocationName}</option>`;
        $('#locationVillage').children().append(arrayCounty);
    }
}

//  render the climate information
function renderClimate(CWB, v) {
    T = CWB.records.Locations[0].Location[v];

    TNow = T.WeatherElement[0].Time[0].ElementValue[0].Temperature;

    Wx = CWB.records.Locations[0].Location[v].WeatherElement[6];
    WxNow = Wx.Time[0].ElementValue[0].MinApparentTemperature;

    weatherSwitch(WxNow);

    print = `
  ${CWB.records.Locations[0].Location[v].LocationsName}
  `;
    $('#theVillage').html(print);

    print = `
		<h2>${TNow}°</h2>
    <div class="weatherIcon_container">${weatherIcon}</div>
		`;
    $('.weather_container').html(print);

    $('.temperature_line').empty();

    temperatureRange();

    // week
    const date1 = new Date(now);
    deleteFirstDay(); // delete first day information
    $('.daily_container').empty();
    $('.temperature').remove();

    for (i = 0; i < 5; i++) {
        date1.setDate(date1.getDate() + 1);
        let week1 = date1.getDay();
        let futureWeek = '週' + day_list[week1];

        let month = date1.getMonth() + 1;
        let date = date1.getDate();
        let futureDate = month + '/' + date;

        futureWx = Wx.Time[y + i * 2].ElementValue[0].MinApparentTemperature;
        futureTempH = T.WeatherElement[1].Time[y + i * 2].ElementValue[0].MaxTemperature;
        futureTempL = T.WeatherElement[2].Time[y + 1 + i * 2].ElementValue[0].MinTemperature;

        weatherSwitch(futureWx);

        print = `
				<div class="future_container" id="future_container_${i}">
          <p>${futureWeek}</p>
          <p>${futureDate}</p>
          <div class="weatherIcon_container">${weatherIcon}</div>
				</div>
				`;

        $('.daily_container').append(print);

        LowPosition = 80 - (futureTempL - MinTemp) * distance;
        HighPosition = 0 + (MaxTemp - futureTempH) * distance;
        print = `
    <div class="temperature" id="temperature_${i}">
      <div class="temperatureH" style="top: ${HighPosition}px">
        <p id="futureTempHText">${futureTempH}°</p>
        <div class="dot"></div>
      </div>
      <div class="temperatureL" style="top: ${LowPosition}px">
        <div class="dot"></div>
        <p>${futureTempL}°</p>
      </div>
    </div>
    `;
        $('.temperature_container').append(print);
    }
}

// add weather icon
function weatherSwitch(thisWx) {
    if (thisWx <= 3 || (24 <= thisWx && thisWx <= 25)) {
        weatherIcon = `<svg class="weatherIcon"
    id="IconSun"
    xmlns="http://www.w3.org/2000/svg"
    x="0px"
    y="0px"
    viewBox="0 0 30 30">
    <line class="line" id="line1" x1="15" y1="30" x2="15" y2="26.9"/>
    <line class="line" id="line1" x1="15" y1="3.8" x2="15" y2="0"/>
    <line class="line" id="line2" x1="25.6" y1="25.6" x2="23.5" y2="23.5"/>
    <line class="line" id="line2" x1="7.1" y1="7.1" x2="4.4" y2="4.4"/>
    <line class="line" id="line1" x1="30" y1="15" x2="26.7" y2="15"/>
    <line class="line" id="line1" x1="3.6" y1="15" x2="0" y2="15"/>
    <line class="line" id="line2" x1="25.6" y1="4.4" x2="23.1" y2="6.9"/>
    <line class="line" id="line2" x1="6.7" y1="23.3" x2="4.4" y2="25.6"/>
    <circle class="circle" cx="15.2" cy="15.4" r="8.1"/>
</svg>`;
    } else if ((4 <= thisWx && thisWx <= 7) || (26 <= thisWx && thisWx <= 28)) {
        weatherIcon = `<svg class="weatherIcon"
      id="IconCloud"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      viewBox="0 0 31.3 23.9">
      <path d="M30.6,15.1c0,3.8-3.1,6.9-6.9,6.9c-1.4,0-2.7-0.4-3.9-1.2c-2.5,2.9-6.8,3.3-9.7,0.8l0,0
        c-3.5,1.4-7.6-0.3-9-3.9s0.3-7.6,3.9-9C4.9,8.3,4.9,7.9,4.9,7.5c0-3.8,3.1-6.9,6.9-6.9c1.9,0,3.7,0.8,5,2.2
        c1-0.6,2.2-0.9,3.4-0.9c3.8,0,6.9,3.1,6.9,6.9l0,0c0,0.1,0,0.2,0,0.3C29.3,10.3,30.6,12.6,30.6,15.1z" />
    </svg>`;
    } else {
        weatherIcon = `<svg class="weatherIcon"
      id="IconRain"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      viewBox="0 0 31.4 28.7">

      <path class="st0" d="M30.6,15.2c0,3.8-3.2,7-7,7c-1.4,0-2.7-0.4-3.8-1.2c-2.5,3-6.9,3.3-9.9,0.8l0,0c-0.8,0.3-1.5,0.4-2.4,0.4
        c-3.8,0-6.9-3.2-6.9-7.1c0-2.7,1.6-5.1,4.2-6.2C4.7,8.5,4.7,8.1,4.7,7.7c0-3.8,3.2-7,7-7c1.9,0,3.7,0.8,5,2.2
        c1.1-0.7,2.3-1,3.5-1c3.8,0,6.9,3.1,7,6.9c0,0.1,0,0.2,0,0.3C29.3,10.4,30.6,12.7,30.6,15.2z"/>
      <line class="line" id="line1" x1="7.2" y1="22.5" x2="4.8" y2="26"/>
      <line class="line" id="line2" x1="14.9" y1="24.7" x2="12.5" y2="28.2"/>
      <line class="line" id="line3" x1="23.6" y1="22.5" x2="21.2" y2="26"/>
    </svg>`;
    }
}

// get the max and min temperature of next five days
function temperatureRange() {
    deleteFirstDay();
    const MaxTempArray = [];
    const MinTempArray = [];
    for (i = 0; i < 5; i++) {
        futureTempH = T.WeatherElement[1].Time[y + i * 2].ElementValue[0].MaxTemperature;
        MaxTempArray.push(futureTempH);
        futureTempL = T.WeatherElement[2].Time[y + 1 + i * 2].ElementValue[0].MinTemperature;
        MinTempArray.push(futureTempL);
    }

    MaxTemp = Math.max(...MaxTempArray);
    MinTemp = Math.min(...MinTempArray); // standard of line
    distance = 70 / (MaxTemp - MinTemp); // get the class interval

    SVGline(MaxTempArray, MinTempArray, MaxTemp, MinTemp, distance);
}

// delete first day information
function deleteFirstDay() {
    y = 0;
    for (x = 0; x < 5; x++) {
        WxNowStartTime = Wx.Time[x].StartTime;
        let todayDate = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2);

        if (JSON.stringify(WxNowStartTime).includes(todayDate) == true || JSON.stringify(WxNowStartTime).includes('00:00:00') == true) {
            y++;
        }
    }
}

// render the number line of temperature
function SVGline(MaxTempArray, MinTempArray, MaxTemp, MinTemp, distance) {
    HighP1 = 18 + (MaxTemp - MaxTempArray[0]) * distance;
    HighP2 = 18 + (MaxTemp - MaxTempArray[1]) * distance;
    HighP3 = 18 + (MaxTemp - MaxTempArray[2]) * distance;
    HighP4 = 18 + (MaxTemp - MaxTempArray[3]) * distance;
    HighP5 = 18 + (MaxTemp - MaxTempArray[4]) * distance;

    LowP1 = 82 - (MinTempArray[0] - MinTemp) * distance;
    LowP2 = 82 - (MinTempArray[1] - MinTemp) * distance;
    LowP3 = 82 - (MinTempArray[2] - MinTemp) * distance;
    LowP4 = 82 - (MinTempArray[3] - MinTemp) * distance;
    LowP5 = 82 - (MinTempArray[4] - MinTemp) * distance;
    print = `
  <svg id="SVGlineH" width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="none">
    <path
    d="M0 ${HighP1} C25 ${HighP1},
    25 ${HighP2} ,50 ${HighP2} C75 ${HighP2},
    75 ${HighP3} ,100 ${HighP3} C125 ${HighP3},
    125 ${HighP4} ,150 ${HighP4} C175 ${HighP4},
    175 ${HighP5} ,200,${HighP5}"
    >
    </path>
  </svg>

  <svg id="SVGlineL" width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="none">
    <path
    d="M0 ${LowP1} C25 ${LowP1},
    25 ${LowP2} ,50 ${LowP2} C75 ${LowP2},
    75 ${LowP3} ,100 ${LowP3} C125 ${LowP3},
    125 ${LowP4} ,150 ${LowP4} C175 ${LowP4},
    175 ${LowP5} ,200,${LowP5}"
    ></path>
  </svg>`;
    $('.temperature_line').append(print);
}

// if change county data
$('#theCountySelect').change(function changeCounty() {
    clientCountyCode = $('#theCountySelect').val();
    clientLocationTown = '';

    getCwbApi(clientCountyCode, clientLocationTown);
});

// if change village data
$('#theVillageSelect').change(function changeVillage() {
    clientCountyCode = $('#theCountySelect').val();

    VillageValue = $('#theVillageSelect option:selected').text();

    getCwbApi(clientCountyCode, VillageValue);
});

// when click picture
$('.picture_container').click(function () {
    $('.card').toggleClass('active');
});
