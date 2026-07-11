import React from 'react';
import SmokeTestsPage from '../pages/home';

const testsRouteOptions = {
  headerShown: false,
  headerBackVisible: false,
  showBottomToolBar: false,
  showCompanyFilter: false,
  title: 'Resultados de testes',
};

const testsRoutes = [
  {
    name: 'SmokeTestsPage',
    component: SmokeTestsPage,
    path: 'tests',
    options: testsRouteOptions,
  },
  {
    name: 'TestsPlaygroundPage',
    component: SmokeTestsPage,
    path: 'tests',
    options: testsRouteOptions,
  },
];

export default testsRoutes;
