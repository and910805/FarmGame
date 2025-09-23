export class GameFormatter {
  static weatherName(weatherType) {
    const names = {
      sunny: '晴天',
      rainy: '雨天',
      cloudy: '陰天',
      storm: '暴風雨',
      snow: '雪天',
    };
    return names[weatherType];
  }

  static seasonName(seasonType) {
    const names = {
      spring: '春天',
      summer: '夏天',
      autumn: '秋天',
      winter: '冬天',
    };
    return names[seasonType];
  }

  static weatherIcon(weatherType) {
    switch (weatherType) {
      case 'rainy':
        return '🌧️';
      case 'cloudy':
        return '☁️';
      case 'storm':
        return '⛈️';
      case 'snow':
        return '❄️';
      default:
        return '☀️';
    }
  }
}

