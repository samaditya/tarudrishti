import React from 'react';
import { renderToString } from 'react-dom/server';
import { ThemeProvider } from './src/context/ThemeContext.jsx';
import WeatherWidget from './src/components/WeatherWidget.jsx';

try {
  renderToString(
    React.createElement(ThemeProvider, null, 
      React.createElement(WeatherWidget)
    )
  );
  console.log("RENDER SUCCESS!");
} catch (e) {
  console.log("RENDER ERROR:", e);
}
