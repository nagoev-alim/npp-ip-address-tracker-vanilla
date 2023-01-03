// ⚡️ Import Styles
import './style.scss';
import feather from 'feather-icons';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { showNotification } from './modules/showNotification.js';
import pin from './assets/images/pin.svg';

// ⚡️ Render Skeleton
const mock = [
  {
    name: 'IP Address',
    value: '101.11.201.22',
    dataType: 'ip',
  },
  {
    name: 'Location',
    value: 'TW Taiwan',
    dataType: 'location',
  },
  {
    name: 'Timezone',
    value: 'UTC +08:00',
    dataType: 'timezone',
  },
  {
    name: 'ISP',
    value: 'Taiwan Mobile Co., Ltd.',
    dataType: 'isp',
  },
];
document.querySelector('#app').innerHTML = `
<div class='app-container'>
  <div class='address-tracker'>
    <h2 class='title'>IP Address Tracker</h2>
    <form data-form=''>
      <input type='text' name='query' placeholder='Search for any IP address or domain'>
    </form>
    <ul>
      ${mock.map(({ name, value, dataType }) => `
        <li>
          <p class='h5'>${name}</p>
          ${dataType === 'timezone' ? `<p>UTC <span data-${dataType}>${value}</span></p>` : `<p data-${dataType}>${value}</p>`}
        </li>
      `).join('')}
    </ul>
    <div class='map' data-map=''></div>
  </div>

  <a class='app-author' href='https://github.com/nagoev-alim' target='_blank'>${feather.icons.github.toSvg()}</a>
</div>
`;

// ⚡️Create Class
class App {
  constructor() {
    this.DOM = {
      form: document.querySelector('[data-form]'),
      map: document.querySelector('[data-map]'),
      fields: {
        ip: document.querySelector('[data-ip]'),
        location: document.querySelector('[data-location]'),
        timezone: document.querySelector('[data-timezone]'),
        isp: document.querySelector('[data-isp]'),
      },
    };

    this.PROPS = {
      map: L.map(this.DOM.map, {
        center: [51.505, -0.09],
        zoom: 13,
      }),
      marker: L.icon({
        iconUrl: pin,
        iconSize: [30, 40],
      }),
    };

    this.fetchData(this.storageGet());
    this.mapConfig();
    this.DOM.form.addEventListener('submit', this.onSubmit);
  }

  /**
   * @function fetchData - Fetch data from API
   * @param address
   * @returns {Promise<void>}
   */
  fetchData = async (address) => {
    console.log(address);
    try {
      const {
        data: {
          ip,
          isp,
          location: { country, region, timezone, lat, lng },
        },
      } = await axios.get(`https://geo.ipify.org/api/v2/country,city?apiKey=at_D5MQsxItBHTAuuGXJEefzDtDNm2QH&ipAddress=${address}`);

      this.DOM.fields.ip.textContent = ip;
      this.DOM.fields.location.textContent = `${country} ${region}`;
      this.DOM.fields.timezone.textContent = timezone;
      this.DOM.fields.isp.textContent = isp;

      this.PROPS.map.setView([lat, lng]);
      L.marker([lat, lng], { icon: this.PROPS.marker }).addTo(this.PROPS.map);

      if (window.matchMedia('(max-width: 992px)').matches) this.addOffset();

    } catch (e) {
      console.log(e);
      showNotification('danger', 'Something wrong, look console :(');
    }
  };

  /**
   * @function mapConfig - Config map
   */
  mapConfig = () => {
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.PROPS.map);
    L.marker([51.505, -0.09], { icon: this.PROPS.marker }).addTo(this.PROPS.map);
  };

  /**
   * @function addOffset - Add offset form mobile devices
   */
  addOffset = () => {
    const offsetY = this.PROPS.map.getSize().y * 0.15;
    this.PROPS.map.panBy([0, -offsetY], { animate: false });
  };

  /**
   * @function onSubmit - Form submit event handler
   * @param event
   */
  onSubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    const ip = Object.fromEntries(new FormData(form).entries()).query.trim();

    if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)) {
      showNotification('warning', 'You have entered an invalid IP address.');
      return;
    }

    this.storageSet(ip);
    this.fetchData(ip);
  };

  /**
   * @function storageGet - Get data from local storage
   * @returns {any|string}
   */
  storageGet = () => {
    return localStorage.getItem('ip-address') ? JSON.parse(localStorage.getItem('ip-address')) : '101.11.201.22';
  };

  /**
   * @function storageSet - Set data to local storage
   * @param ip
   */
  storageSet = (ip) => {
    return localStorage.setItem('ip-address', JSON.stringify(ip));
  };
}

// ⚡️Class instance
new App();
