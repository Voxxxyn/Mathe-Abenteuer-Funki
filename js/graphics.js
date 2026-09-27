/* Mathe-Abenteuer – alle Grafiken als SVG (keine externen Dateien nötig). */
(function (root) {
  'use strict';
  var MA = root.MA = root.MA || {};

  function svg(vb, body, cls, label) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" class="' + (cls || '') + '"' +
      (label ? ' role="img" aria-label="' + label + '"' : ' aria-hidden="true" focusable="false"') + '>' + body + '</svg>';
  }

  /* Maskottchen „Funki“, ein kleiner Drache. Gesichtsausdruck per CSS-Klasse am Container. */
  function mascot() {
    return svg('0 0 200 210',
      '<g class="m-body">' +
      '<path class="m-tail" d="M138 170 Q182 172 186 140 Q188 124 176 122 Q182 142 160 150 Q146 154 132 150Z" fill="#35A874"/>' +
      '<path d="M178 118 l10 -4 -3 10Z" fill="#FFB84D"/>' +
      '<g class="m-wing-l"><path d="M58 112 Q14 88 18 128 Q30 118 36 132 Q44 120 56 136Z" fill="#7BDDB0" stroke="#35A874" stroke-width="3" stroke-linejoin="round"/></g>' +
      '<g class="m-wing-r"><path d="M142 112 Q186 88 182 128 Q170 118 164 132 Q156 120 144 136Z" fill="#7BDDB0" stroke="#35A874" stroke-width="3" stroke-linejoin="round"/></g>' +
      '<ellipse cx="100" cy="148" rx="48" ry="46" fill="#4CC38A"/>' +
      '<ellipse cx="100" cy="158" rx="31" ry="31" fill="#FFE29A"/>' +
      '<path d="M80 146 H120 M78 160 H122 M82 174 H118" stroke="#F5C868" stroke-width="3" stroke-linecap="round"/>' +
      '<ellipse cx="76" cy="192" rx="17" ry="10" fill="#35A874"/><ellipse cx="124" cy="192" rx="17" ry="10" fill="#35A874"/>' +
      '<g class="m-arm-l"><ellipse cx="58" cy="148" rx="10" ry="17" fill="#35A874" transform="rotate(25 58 148)"/></g>' +
      '<g class="m-arm-r"><ellipse cx="142" cy="148" rx="10" ry="17" fill="#35A874" transform="rotate(-25 142 148)"/></g>' +
      '<g class="m-head">' +
      '<path d="M66 44 Q58 14 74 20 Q78 34 82 42Z" fill="#FFB84D"/><path d="M134 44 Q142 14 126 20 Q122 34 118 42Z" fill="#FFB84D"/>' +
      '<path d="M92 36 L100 22 L108 36Z" fill="#FFB84D"/>' +
      '<ellipse cx="100" cy="82" rx="54" ry="46" fill="#4CC38A"/>' +
      '<ellipse cx="100" cy="104" rx="30" ry="18" fill="#6FD4A2"/>' +
      '<circle cx="90" cy="100" r="3" fill="#2E8C60"/><circle cx="110" cy="100" r="3" fill="#2E8C60"/>' +
      '<circle cx="62" cy="96" r="9" fill="#FF9EB5" opacity=".75"/><circle cx="138" cy="96" r="9" fill="#FF9EB5" opacity=".75"/>' +
      '<g class="m-eyes-open"><ellipse cx="78" cy="76" rx="13" ry="15" fill="#fff"/><ellipse cx="122" cy="76" rx="13" ry="15" fill="#fff"/>' +
      '<circle class="m-pupil" cx="80" cy="79" r="8" fill="#2B2A4C"/><circle class="m-pupil" cx="120" cy="79" r="8" fill="#2B2A4C"/>' +
      '<circle cx="83" cy="75" r="3" fill="#fff"/><circle cx="123" cy="75" r="3" fill="#fff"/></g>' +
      '<g class="m-eyes-happy" display="none" fill="none" stroke="#2B2A4C" stroke-width="5" stroke-linecap="round"><path d="M67 80 Q78 66 89 80"/><path d="M111 80 Q122 66 133 80"/></g>' +
      '<g class="m-eyes-think" display="none"><ellipse cx="78" cy="76" rx="13" ry="15" fill="#fff"/><ellipse cx="122" cy="76" rx="13" ry="15" fill="#fff"/>' +
      '<circle cx="84" cy="70" r="8" fill="#2B2A4C"/><circle cx="126" cy="70" r="8" fill="#2B2A4C"/><circle cx="86" cy="67" r="3" fill="#fff"/><circle cx="128" cy="67" r="3" fill="#fff"/></g>' +
      '<path class="m-mouth-smile" d="M88 112 Q100 124 112 112" fill="none" stroke="#2B2A4C" stroke-width="4" stroke-linecap="round"/>' +
      '<path class="m-mouth-open" display="none" d="M86 110 Q100 132 114 110Z" fill="#2B2A4C"/>' +
      '<path class="m-mouth-hmm" display="none" d="M92 116 Q100 112 108 116" fill="none" stroke="#2B2A4C" stroke-width="4" stroke-linecap="round"/>' +
      '</g></g>', 'mascot-svg', 'Funki, der kleine Drache');
  }

  var ICON = {
    star: '<path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2 6.1 20.4l1.3-6.5L2.5 9.3l6.6-.8z" fill="#FFC93C" stroke="#E0A100" stroke-width="1.4" stroke-linejoin="round"/>',
    starEmpty: '<path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2 6.1 20.4l1.3-6.5L2.5 9.3l6.6-.8z" fill="#E6E2F0" stroke="#CBC4DD" stroke-width="1.4" stroke-linejoin="round"/>',
    coin: '<circle cx="12" cy="12" r="10" fill="#FFC93C" stroke="#E0A100" stroke-width="1.6"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#E0A100" stroke-width="1.4"/><path d="M12 8.5v7" stroke="#E0A100" stroke-width="2" stroke-linecap="round"/>',
    flame: '<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill="#FF7A2E"/><path d="M12 12c.6 2 3 3 3 5a3 3 0 0 1-6 0c0-1.5 1-2.5 1.5-3 .2 1 .8 1.5 1.5 1.5 0-1.3-.4-2.3 0-3.5z" fill="#FFD54A"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="#8B85A8"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#8B85A8" stroke-width="2.4"/><circle cx="12" cy="15.5" r="1.8" fill="#fff"/>',
    gear: '<path d="M10.3 2h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9L2 13.7v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8z" fill="currentColor"/><circle cx="12" cy="12" r="3.4" fill="#fff"/>',
    back: '<path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="currentColor" opacity=".25"/><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    bag: '<path d="M5 8h14l-1.2 11.5a2 2 0 0 1-2 1.5H8.2a2 2 0 0 1-2-1.5z" fill="currentColor" opacity=".3"/><path d="M5 8h14l-1.2 11.5a2 2 0 0 1-2 1.5H8.2a2 2 0 0 1-2-1.5zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    del: '<path d="M9 5h11v14H9l-6-7z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M12 9l5 6M17 9l-5 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    check: '<path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>',
    flag: '<path d="M6 21V4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M6 4h11l-2.5 4L17 12H6z" fill="currentColor"/>',
    bulb: '<path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" fill="#FFD54A" stroke="#E0A100" stroke-width="1.4"/><rect x="8.5" y="18" width="7" height="3" rx="1.2" fill="#8B85A8"/>',
    play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
  };
  function icon(name, cls, label) { return svg('0 0 24 24', ICON[name] || '', 'icon ' + (cls || ''), label); }

  function chest(open, cls) {
    var lid = open ? '' :
      '<path class="chest-lid" d="M12 50 V36 Q12 12 50 12 Q88 12 88 36 V50Z" fill="#D98C45" stroke="#8A4F22" stroke-width="3"/><path d="M12 36 Q12 12 50 12 Q88 12 88 36" fill="none" stroke="#FFC93C" stroke-width="5"/>';
    var glow = open
      ? '<ellipse cx="50" cy="24" rx="50" ry="34" fill="#FFF3A6" opacity=".6"/><g class="chest-lid-open"><path d="M14 50 L22 14 H78 L86 50Z" fill="#8A4F22"/><path d="M20 46 L26 20 H74 L80 46Z" fill="#6B3A17"/><path d="M22 14 H78" stroke="#FFC93C" stroke-width="5" stroke-linecap="round"/></g>' +
        '<g fill="#FFC93C" stroke="#E0A100" stroke-width="1.5"><ellipse cx="34" cy="48" rx="9" ry="5"/><ellipse cx="52" cy="45" rx="9" ry="5"/><ellipse cx="68" cy="48" rx="9" ry="5"/><ellipse cx="44" cy="50" rx="9" ry="5"/><ellipse cx="60" cy="50" rx="9" ry="5"/></g>' +
        '<g class="chest-sparkle" fill="#FFE14D"><path d="M50 -14 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3Z"/><circle cx="20" cy="4" r="3"/><circle cx="82" cy="0" r="3"/></g>'
      : '';
    return svg('0 -20 100 110',
      glow +
      '<rect x="12" y="48" width="76" height="40" rx="6" fill="#C57A38" stroke="#8A4F22" stroke-width="3"/>' +
      '<rect x="12" y="48" width="76" height="8" fill="#FFC93C"/>' +
      '<rect x="22" y="48" width="8" height="40" fill="#FFC93C" opacity=".85"/><rect x="70" y="48" width="8" height="40" fill="#FFC93C" opacity=".85"/>' +
      '<rect x="42" y="50" width="16" height="18" rx="3" fill="#FFE14D" stroke="#8A4F22" stroke-width="2"/><circle cx="50" cy="58" r="2.5" fill="#8A4F22"/>' +
      lid, 'chest-svg ' + (cls || ''), open ? 'Offene Schatztruhe' : 'Schatztruhe');
  }

  var ITEM_ART = {
    klee: '<g fill="#3DBE6E"><circle cx="38" cy="36" r="15"/><circle cx="62" cy="36" r="15"/><circle cx="38" cy="58" r="15"/><circle cx="62" cy="58" r="15"/></g><path d="M50 50 Q52 76 64 88" stroke="#2E8C52" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="50" cy="47" r="6" fill="#6CD68F"/>',
    sonnenblume: '<path d="M50 60 V94" stroke="#3DBE6E" stroke-width="6" stroke-linecap="round"/><path d="M50 80 Q30 70 30 84 Q42 88 50 80Z" fill="#3DBE6E"/><g fill="#FFC93C">' +
      [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { return '<ellipse cx="50" cy="20" rx="8" ry="15" transform="rotate(' + a + ' 50 40)"/>'; }).join('') +
      '</g><circle cx="50" cy="40" r="13" fill="#8A4F22"/><g fill="#6B3A17"><circle cx="46" cy="37" r="2"/><circle cx="54" cy="38" r="2"/><circle cx="50" cy="44" r="2"/></g>',
    pilz: '<rect x="40" y="52" width="20" height="34" rx="8" fill="#FFF1E0"/><path d="M14 56 Q50 -4 86 56Z" fill="#B55CE6"/><g fill="#fff"><circle cx="36" cy="38" r="6"/><circle cx="58" cy="28" r="5"/><circle cx="68" cy="46" r="4"/></g>',
    feder: '<path d="M70 12 Q34 20 28 70 L34 72 Q50 34 70 12Z" fill="#4C7BF3"/><path d="M70 12 Q76 50 34 72 Q52 40 70 12Z" fill="#7FA2FF"/><path d="M70 12 Q46 44 22 90" stroke="#2A52C0" stroke-width="3" fill="none" stroke-linecap="round"/>',
    schild: '<path d="M50 8 L84 20 V48 Q84 76 50 92 Q16 76 16 48 V20Z" fill="#4C7BF3" stroke="#2A52C0" stroke-width="4"/><path d="M50 8 V92 M16 44 H84" stroke="#FFC93C" stroke-width="7"/><circle cx="50" cy="44" r="9" fill="#FFC93C"/>',
    krone: '<path d="M14 72 L18 30 L36 50 L50 20 L64 50 L82 30 L86 72Z" fill="#FFC93C" stroke="#E0A100" stroke-width="3" stroke-linejoin="round"/><rect x="14" y="70" width="72" height="12" rx="3" fill="#F5A524"/><circle cx="50" cy="56" r="6" fill="#FF4D7D"/><circle cx="32" cy="62" r="4" fill="#4DD8FF"/><circle cx="68" cy="62" r="4" fill="#3DBE6E"/>',
    kristall: '<path d="M50 6 L78 34 L50 94 L22 34Z" fill="#FF4D7D"/><path d="M50 6 L78 34 L50 40Z" fill="#FF8FAE"/><path d="M22 34 L50 40 L50 94Z" fill="#D12E5C"/><path d="M36 20 L42 30" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
    drachenei: '<ellipse cx="50" cy="54" rx="30" ry="38" fill="#7BDDB0" stroke="#35A874" stroke-width="3"/><g fill="#4CC38A"><circle cx="38" cy="40" r="6"/><circle cx="60" cy="56" r="8"/><circle cx="42" cy="72" r="5"/><circle cx="62" cy="32" r="4"/></g><path d="M34 26 Q40 20 46 22" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>',
    rakete: '<path d="M50 6 Q72 28 68 70 H32 Q28 28 50 6Z" fill="#F3F4FF" stroke="#8B85A8" stroke-width="2"/><circle cx="50" cy="38" r="10" fill="#4DD8FF" stroke="#4C7BF3" stroke-width="4"/><path d="M32 50 L16 80 L32 72Z M68 50 L84 80 L68 72Z" fill="#F2603A"/><path d="M40 70 Q50 100 60 70Z" fill="#FFC93C"/>',
    komet: '<path d="M18 86 Q40 50 64 36" stroke="#B9A8FF" stroke-width="12" stroke-linecap="round" opacity=".6"/><path d="M28 86 Q48 58 66 42" stroke="#FFE27A" stroke-width="6" stroke-linecap="round"/><path d="M70 14 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6Z" fill="#FFC93C" stroke="#E0A100" stroke-width="2" stroke-linejoin="round"/>'
  };
  function item(id, cls, label) {
    return svg('0 0 100 100', ITEM_ART[id] || '', 'item-svg ' + (cls || ''), label);
  }

  var BADGE_SYM = {
    w1: '<circle cx="50" cy="46" r="13" fill="#FFF3A6"/><g stroke="#FFF3A6" stroke-width="5" stroke-linecap="round"><path d="M50 22v-6M50 76v-6M26 46h-6M80 46h-6M33 29l-4-4M71 67l-4-4M67 29l4-4M29 67l4-4"/></g>',
    w2: '<path d="M50 20 L72 58 H28Z" fill="#DDF6E8"/><path d="M50 36 L70 72 H30Z" fill="#fff"/><rect x="46" y="70" width="8" height="10" fill="#DDF6E8"/>',
    w3: '<path d="M28 76 V38 H36 V46 H44 V38 H56 V46 H64 V38 H72 V76Z" fill="#fff"/><path d="M44 76 V62 Q50 54 56 62 V76Z" fill="#4C7BF3"/>',
    w4: '<path d="M50 18 L70 44 L50 80 L30 44Z" fill="#fff"/><path d="M50 18 L70 44 L50 48Z" fill="#FFE3D8"/>',
    w5: '<path d="M50 18 l8 18 20 2 -15 13 5 20 -18 -11 -18 11 5 -20 -15 -13 20 -2Z" fill="#fff"/>'
  };
  function badge(wIndex, cls, label) {
    var w = MA.Game.WORLDS[wIndex];
    return svg('0 0 100 110',
      '<path d="M32 80 L24 108 L40 100 L48 110 L50 84Z M68 80 L76 108 L60 100 L52 110 L50 84Z" fill="' + w.dark + '"/>' +
      '<circle cx="50" cy="48" r="42" fill="#FFC93C" stroke="#E0A100" stroke-width="4"/>' +
      '<circle cx="50" cy="48" r="33" fill="' + w.color + '"/>' + BADGE_SYM[w.id], 'badge-svg ' + (cls || ''), label);
  }

  MA.Gfx = { mascot: mascot, icon: icon, chest: chest, item: item, badge: badge, svg: svg };
})(typeof window !== 'undefined' ? window : globalThis);
