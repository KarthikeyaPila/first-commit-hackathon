import { getMarket, getNationalStories, getRunStatus, getStateArticles, getStateStories, getStory, startProcessing } from "./backendApi";

export function initLegacy(){

"use strict";
/* ============================================================
   DATA — GEOMETRY
   Outlines are stored as [lon,lat, lon,lat, ...] so they stay
   human-readable and get projected into SVG units at runtime.
   Islands use an array of rings.
   ============================================================ */
const GEO = {
"jammu-kashmir":[74.3,32.28, 73.85,32.5, 73.4,32.8, 73.15,33.15, 73.25,33.5, 73.47,33.85, 73.47,34.37, 73.3,34.75, 73.65,35.15, 74,35.55, 73.75,36.15, 73.55,36.55, 74.15,36.95, 75,37.05, 75.65,36.7, 76.1,36.2, 76,35.65, 75.85,35.1, 76.3,34.7, 76.15,34.2, 76.45,33.75, 76.8,33.35, 76.7,32.95, 76.35,32.72, 75.98,32.52, 75.62,32.3, 75.3,32.32, 74.95,32.3, 74.62,32.26],
"ladakh":[75.85,35.1, 76.3,35.55, 77,35.8, 77.8,35.85, 78.6,35.7, 79.3,35.85, 80,35.5, 80.4,34.9, 80.2,34.2, 79.8,33.6, 79.5,33, 79.15,32.7, 78.95,32.5, 78.75,32.45, 78.3,32.58, 77.85,32.65, 77.35,32.8, 76.7,32.95, 76.8,33.35, 76.45,33.75, 76.15,34.2, 76.3,34.7],
"himachal-pradesh":[75.62,32.3, 75.98,32.52, 76.35,32.72, 76.7,32.95, 77.35,32.8, 77.85,32.65, 78.3,32.58, 78.75,32.45, 78.95,32.05, 79.05,31.6, 78.8,31.3, 78.6,31.15, 78.3,31, 78.05,30.75, 77.9,30.5, 77.75,30.48, 77.58,30.42, 77.35,30.55, 77.1,30.65, 76.85,30.72, 76.55,31, 76.2,31.35, 75.98,31.72, 75.82,32.02],
"punjab":[73.88,30.45, 74.05,30.75, 74.3,31.05, 74.6,31.35, 74.55,31.72, 74.15,31.95, 74.3,32.28, 74.62,32.26, 74.95,32.3, 75.3,32.32, 75.62,32.3, 75.82,32.02, 75.98,31.72, 76.2,31.35, 76.55,31, 76.85,30.72, 76.7,30.55, 76.35,30.35, 75.95,30.15, 75.55,29.95, 75.2,29.72, 74.7,29.95, 74.3,30.15],
"haryana":[75.2,29.72, 75.55,29.95, 75.95,30.15, 76.35,30.35, 76.7,30.55, 76.85,30.72, 77.1,30.65, 77.35,30.55, 77.58,30.42, 77.52,30.08, 77.4,29.7, 77.28,29.38, 77.32,29.05, 77.55,28.78, 77.6,28.5, 77.45,28.25, 77.3,27.95, 77.15,27.7, 76.65,27.95, 76.3,28.2, 75.9,28.55, 75.4,28.95, 75.05,29.35],
"delhi":[76.86,28.62, 76.94,28.88, 77.18,28.92, 77.34,28.74, 77.36,28.5, 77.16,28.38, 76.92,28.46],
"uttarakhand":[77.9,30.5, 78.05,30.75, 78.3,31, 78.6,31.15, 78.8,31.3, 79.2,31.4, 79.6,31.05, 80.05,30.75, 80.35,30.45, 80.75,30.35, 81.05,30.2, 80.75,29.85, 80.5,29.55, 80.25,29.2, 80.1,28.9, 79.7,29.2, 79.25,29.45, 78.85,29.75, 78.45,30, 78.1,30.25],
"uttar-pradesh":[77.58,30.42, 77.75,30.48, 77.9,30.5, 78.1,30.25, 78.45,30, 78.85,29.75, 79.25,29.45, 79.7,29.2, 80.1,28.9, 80.5,28.65, 80.9,28.45, 81.45,28.2, 82,27.95, 82.55,27.7, 83.1,27.5, 83.6,27.4, 84.15,27.05, 84.65,26.75, 84.55,26.4, 84.4,26.05, 84.2,25.7, 83.95,25.35, 84.1,25, 84,24.65, 83.85,24.35, 83.6,24.2, 83.4,23.95, 83.15,24.1, 82.8,24.15, 82.45,24.1, 82,24.15, 81.5,24.2, 81,24.35, 80.55,24.6, 80.1,24.8, 79.7,25.05, 79.3,25.4, 78.95,25.65, 78.6,25.9, 78.25,25.95, 78.05,26.35, 77.75,26.7, 77.45,27.05, 77.25,27.4, 77.15,27.7, 77.3,27.95, 77.45,28.25, 77.6,28.5, 77.55,28.78, 77.32,29.05, 77.28,29.38, 77.4,29.7, 77.52,30.08],
"rajasthan":[73.88,30.45, 74.3,30.15, 74.7,29.95, 75.2,29.72, 75.05,29.35, 75.4,28.95, 75.9,28.55, 76.3,28.2, 76.65,27.95, 77.15,27.7, 77.25,27.4, 77.45,27.05, 77.75,26.7, 78.05,26.35, 78.25,25.95, 77.95,25.55, 77.6,25.15, 77.25,24.75, 76.85,24.45, 76.4,24.2, 75.95,23.95, 75.5,23.7, 75.05,23.6, 74.6,23.55, 74.25,23.25, 73.9,23.4, 73.55,23.7, 73.25,24.05, 72.95,24.35, 72.55,24.45, 72.1,24.55, 71.55,24.6, 71.05,24.45, 70.65,24.8, 70.35,25.3, 70,25.75, 69.55,26.25, 69.85,26.75, 70.35,27.35, 70.95,27.7, 71.55,27.85, 71.9,28.25, 72.3,28.8, 72.9,29.3, 73.4,29.95],
"gujarat":[71.05,24.45, 70.5,24.32, 69.9,24.28, 69.3,24.25, 68.75,24.22, 68.35,24.05, 68.18,23.78, 68.5,23.6, 69,23.3, 69.45,23.05, 69.95,23, 70.4,23.1, 70.75,22.95, 70.4,22.55, 69.9,22.4, 69.4,22.3, 68.97,22.2, 69.15,21.85, 69.6,21.6, 70.05,21.15, 70.5,20.85, 71,20.7, 71.5,20.78, 71.95,21, 72.1,21.4, 72.2,21.8, 72.45,22.15, 72.6,22.4, 72.85,22.1, 72.95,21.7, 72.78,21.3, 72.9,20.95, 72.85,20.5, 72.8,20.15, 73.15,20.35, 73.5,20.7, 73.75,21.05, 74.05,21.5, 74.35,21.85, 74.55,22.25, 74.5,22.7, 74.25,23.25, 73.9,23.4, 73.55,23.7, 73.25,24.05, 72.95,24.35, 72.55,24.45, 72.1,24.55, 71.55,24.6],
"madhya-pradesh":[74.25,23.25, 74.6,23.55, 75.05,23.6, 75.5,23.7, 75.95,23.95, 76.4,24.2, 76.85,24.45, 77.25,24.75, 77.6,25.15, 77.95,25.55, 78.25,25.95, 78.6,25.9, 78.95,25.65, 79.3,25.4, 79.7,25.05, 80.1,24.8, 80.55,24.6, 81,24.35, 81.5,24.2, 82,24.15, 82.45,24.1, 82.8,24.15, 82.75,23.85, 82.55,23.45, 82.25,23.05, 81.95,22.7, 81.6,22.35, 81.25,22.05, 80.9,21.75, 80.55,21.45, 80,21.35, 79.5,21.35, 79,21.4, 78.5,21.45, 78,21.4, 77.5,21.45, 77,21.4, 76.5,21.45, 76,21.5, 75.5,21.65, 75,21.75, 74.5,21.65, 74.05,21.5, 74.35,21.85, 74.55,22.25, 74.5,22.7],
"chhattisgarh":[82.8,24.15, 83.15,24.1, 83.4,23.95, 83.75,23.7, 84.05,23.35, 84.35,22.9, 84.2,22.45, 83.85,22.1, 83.55,21.7, 83.2,21.25, 82.9,20.8, 82.7,20.3, 82.45,19.85, 82.2,19.4, 81.95,18.95, 81.8,18.35, 81.55,18.05, 81.3,17.85, 80.95,18.2, 80.6,18.55, 80.3,18.85, 80.4,19.3, 80.3,19.8, 80.4,20.3, 80.45,20.85, 80.55,21.45, 80.9,21.75, 81.25,22.05, 81.6,22.35, 81.95,22.7, 82.25,23.05, 82.55,23.45, 82.75,23.85],
"jharkhand":[83.4,23.95, 83.6,24.2, 83.85,24.35, 84.35,24.55, 84.85,24.7, 85.35,24.85, 85.85,24.95, 86.35,24.9, 86.85,24.75, 87.35,24.65, 87.85,24.6, 87.5,24.15, 87.15,23.75, 86.85,23.3, 86.65,22.85, 86.45,22.4, 86,22.15, 85.5,22.05, 85,22, 84.55,22.2, 84.2,22.45, 84.35,22.9, 84.05,23.35, 83.75,23.7],
"bihar":[83.85,24.35, 84,24.65, 84.1,25, 83.95,25.35, 84.2,25.7, 84.4,26.05, 84.55,26.4, 84.65,26.75, 85.2,27.1, 85.75,26.9, 86.3,26.7, 86.85,26.55, 87.35,26.4, 87.85,26.45, 88.15,26.55, 88.05,26.15, 87.95,25.75, 87.85,25.35, 87.9,24.95, 87.85,24.6, 87.35,24.65, 86.85,24.75, 86.35,24.9, 85.85,24.95, 85.35,24.85, 84.85,24.7, 84.35,24.55],
"west-bengal":[88.15,26.55, 88.05,26.8, 88.1,27.05, 88.15,27.15, 88.5,27.3, 88.85,27.1, 89.15,26.85, 89.45,26.78, 89.85,26.7, 89.95,26.4, 89.9,26.05, 89.8,25.95, 89.35,26, 88.95,26.15, 88.65,26.3, 88.42,26.55, 88.25,26.35, 88.32,25.95, 88.42,25.55, 88.2,25.15, 88.35,24.75, 88.15,24.4, 88.35,24, 88.75,23.6, 88.62,23.15, 88.85,22.75, 89,22.4, 89.05,22.1, 88.85,21.75, 88.55,21.65, 88.3,21.55, 88,21.65, 87.7,21.6, 87.35,21.55, 87.05,21.9, 86.75,22.15, 86.45,22.4, 86.65,22.85, 86.85,23.3, 87.15,23.75, 87.5,24.15, 87.85,24.6, 87.9,24.95, 87.85,25.35, 87.95,25.75, 88.05,26.15],
"sikkim":[88.85,27.1, 88.92,27.45, 88.75,27.85, 88.5,28.1, 88.15,27.95, 88.05,27.55, 88.15,27.15, 88.5,27.3],
"assam":[89.85,26.7, 90.2,26.75, 90.7,26.75, 91.2,26.8, 91.7,26.8, 92.2,26.85, 92.7,26.9, 93.2,26.95, 93.7,27.1, 94.2,27.35, 94.7,27.45, 95.2,27.55, 95.7,27.7, 96.15,27.55, 95.8,27.25, 95.45,27, 95.05,26.8, 94.75,26.55, 94.45,26.3, 94.2,26, 93.9,25.7, 93.55,25.45, 93.4,25.15, 93.2,24.85, 93,24.5, 92.65,24.35, 92.3,24.2, 92.25,24.35, 92.15,24.5, 92.25,24.7, 92.45,24.9, 92.5,25.1, 92.6,25.55, 92.3,25.9, 91.85,26.05, 91.35,26.05, 90.85,25.95, 90.35,25.8, 89.9,25.55, 89.85,25.75, 89.8,25.95, 89.9,26.05, 89.95,26.4],
"meghalaya":[89.9,25.55, 90.35,25.8, 90.85,25.95, 91.35,26.05, 91.85,26.05, 92.3,25.9, 92.6,25.55, 92.5,25.1, 92.45,24.9, 92.1,24.95, 91.65,25.1, 91.2,25.1, 90.75,25.15, 90.3,25.2],
"arunachal-pradesh":[91.7,26.8, 91.65,27.2, 91.9,27.65, 92.3,27.9, 92.75,28.2, 93.2,28.5, 93.7,28.75, 94.2,29.05, 94.7,29.3, 95.25,29.15, 95.75,29.05, 96.25,29.2, 96.75,28.75, 97.15,28.35, 97.4,28, 97,27.55, 96.55,27.2, 96.05,26.95, 95.55,26.85, 95.05,26.8, 95.45,27, 95.8,27.25, 96.15,27.55, 95.7,27.7, 95.2,27.55, 94.7,27.45, 94.2,27.35, 93.7,27.1, 93.2,26.95, 92.7,26.9, 92.2,26.85],
"nagaland":[95.05,26.8, 94.75,26.55, 94.45,26.3, 94.2,26, 93.9,25.7, 93.55,25.45, 93.85,25.35, 94.2,25.3, 94.5,25.2, 94.7,25.45, 94.95,25.75, 95.15,26.1, 95.25,26.5],
"manipur":[93.55,25.45, 93.85,25.35, 94.2,25.3, 94.5,25.2, 94.7,24.9, 94.6,24.55, 94.35,24.2, 94.1,23.9, 93.7,23.95, 93.35,24.05, 93.25,24.3, 93,24.5, 93.2,24.85, 93.4,25.15],
"mizoram":[93,24.5, 93.25,24.3, 93.35,24.05, 93.3,23.6, 93.15,23.15, 92.95,22.7, 92.75,22.25, 92.6,21.95, 92.4,22.35, 92.25,22.8, 92.15,23.15, 91.95,23.2, 92.15,23.55, 92.25,23.9, 92.3,24.2, 92.65,24.35],
"tripura":[92.3,24.2, 92.25,23.9, 92.15,23.55, 91.95,23.2, 91.65,23, 91.4,22.98, 91.2,23.25, 91.1,23.6, 91.25,23.95, 91.4,24.15, 91.7,24.35, 92,24.45, 92.15,24.5, 92.25,24.35],
"odisha":[86.45,22.4, 86.75,22.15, 87.05,21.9, 87.35,21.55, 87,21.25, 86.75,20.85, 86.55,20.55, 86.85,20.25, 86.5,19.95, 86.1,19.7, 85.7,19.55, 85.3,19.45, 84.95,19.35, 84.75,19.1, 84.25,19.05, 83.85,18.85, 83.5,18.6, 83.1,18.55, 82.75,18.5, 82.35,18.4, 81.8,18.35, 81.95,18.95, 82.2,19.4, 82.45,19.85, 82.7,20.3, 82.9,20.8, 83.2,21.25, 83.55,21.7, 83.85,22.1, 84.2,22.45, 84.55,22.2, 85,22, 85.5,22.05, 86,22.15],
"maharashtra":[72.8,20.15, 73.15,20.35, 73.5,20.7, 73.75,21.05, 74.05,21.5, 74.5,21.65, 75,21.75, 75.5,21.65, 76,21.5, 76.5,21.45, 77,21.4, 77.5,21.45, 78,21.4, 78.5,21.45, 79,21.4, 79.5,21.35, 80,21.35, 80.55,21.45, 80.45,20.85, 80.4,20.3, 80.3,19.8, 80.4,19.3, 80.3,18.85, 79.9,19.1, 79.45,19.35, 79,19.55, 78.55,19.45, 78.1,19.25, 77.75,19, 77.5,18.65, 77.1,18.3, 76.7,18, 76.25,17.75, 75.8,17.55, 75.35,17.3, 74.95,17, 74.65,16.65, 74.45,16.25, 74.3,15.78, 73.95,15.72, 73.7,15.72, 73.55,16.05, 73.4,16.4, 73.3,16.8, 73.25,17.2, 73.15,17.6, 72.95,18, 72.85,18.45, 72.8,18.9, 72.7,19.25, 72.75,19.7],
"goa":[73.7,15.72, 73.95,15.72, 74.3,15.78, 74.25,15.4, 74.05,15.05, 73.92,14.9, 73.85,15.15, 73.75,15.45],
"karnataka":[74.3,15.78, 74.45,16.25, 74.65,16.65, 74.95,17, 75.35,17.3, 75.8,17.55, 76.25,17.75, 76.7,18, 77.1,18.3, 77.5,18.65, 77.45,17.6, 77.45,17.1, 77.35,16.65, 77.4,16.2, 77.55,15.75, 77.7,15.3, 77.9,14.9, 78.1,14.45, 78.3,14, 78.3,13.55, 78.05,13.15, 77.75,12.95, 77.55,12.6, 77.35,12.2, 77,11.9, 76.65,11.75, 76.25,11.7, 75.95,11.95, 75.7,12.25, 75.45,12.6, 75.15,12.9, 74.85,12.75, 74.75,13.1, 74.65,13.4, 74.5,13.7, 74.35,14, 74.2,14.3, 74.05,14.6, 73.92,14.9, 74.05,15.05, 74.25,15.4],
"telangana":[77.55,15.75, 77.4,16.2, 77.35,16.65, 77.45,17.1, 77.45,17.6, 77.5,18.65, 77.75,19, 78.1,19.25, 78.55,19.45, 79,19.55, 79.45,19.35, 79.9,19.1, 80.3,18.85, 80.6,18.55, 80.95,18.2, 81.3,17.85, 81,17.55, 80.7,17.25, 80.4,16.95, 80.1,16.7, 79.75,16.45, 79.35,16.25, 78.95,16.15, 78.55,15.95, 78.15,15.8],
"andhra-pradesh":[84.75,19.1, 84.35,18.7, 83.95,18.3, 83.55,17.95, 83.25,17.7, 82.85,17.35, 82.55,17, 82.3,16.75, 81.95,16.45, 81.6,16.25, 81.2,16.05, 80.85,15.85, 80.55,15.75, 80.25,15.5, 80.1,15.1, 80.05,14.7, 80.05,14.25, 80.15,13.85, 80.2,13.5, 79.8,13.45, 79.4,13.35, 78.95,13.3, 78.55,13.2, 78.05,13.15, 78.3,13.55, 78.3,14, 78.1,14.45, 77.9,14.9, 77.7,15.3, 77.55,15.75, 78.15,15.8, 78.55,15.95, 78.95,16.15, 79.35,16.25, 79.75,16.45, 80.1,16.7, 80.4,16.95, 80.7,17.25, 81,17.55, 81.3,17.85, 81.55,18.05, 81.8,18.35, 82.35,18.4, 82.75,18.5, 83.1,18.55, 83.5,18.6, 83.85,18.85, 84.25,19.05],
"tamil-nadu":[76.25,11.7, 76.55,11.35, 76.9,11, 77.2,10.6, 77.25,10.15, 77.15,9.7, 77.3,9.25, 77.25,8.8, 77.2,8.4, 77.55,8.08, 77.95,8.35, 78.25,8.65, 78.55,9.05, 78.95,9.25, 79.35,9.28, 79.15,9.65, 79.35,9.95, 79.7,10.25, 79.85,10.55, 79.8,11, 79.95,11.5, 80.1,12, 80.25,12.6, 80.2,13.1, 80.2,13.5, 79.8,13.45, 79.4,13.35, 78.95,13.3, 78.55,13.2, 78.05,13.15, 77.75,12.95, 77.55,12.6, 77.35,12.2, 77,11.9, 76.65,11.75],
"kerala":[74.85,12.75, 75.15,12.9, 75.45,12.6, 75.7,12.25, 75.95,11.95, 76.25,11.7, 76.55,11.35, 76.9,11, 77.2,10.6, 77.25,10.15, 77.15,9.7, 77.3,9.25, 77.25,8.8, 77.2,8.4, 76.85,8.65, 76.55,9.05, 76.3,9.55, 76.15,10.05, 75.95,10.55, 75.7,11.1, 75.45,11.6, 75.15,12.1, 74.95,12.45],
"andaman-nicobar":[
  [92.78,13.58, 93.02,13.4, 93.06,13.05, 92.96,12.82, 92.78,12.95, 92.7,13.25],
  [92.62,12.68, 92.86,12.5, 92.92,12.15, 92.86,11.72, 92.72,11.52, 92.58,11.72, 92.56,12.2],
  [92.5,10.88, 92.7,10.78, 92.76,10.55, 92.62,10.42, 92.48,10.58],
  [92.72,9.28, 92.9,9.2, 92.92,9.02, 92.76,8.96, 92.66,9.12],
  [93.72,7.28, 93.92,7.22, 94,6.98, 93.86,6.78, 93.68,6.92, 93.62,7.12]],
"lakshadweep":[
  [72.16,11.78, 72.34,11.72, 72.36,11.54, 72.18,11.52],
  [72.6,11.12, 72.76,11.06, 72.78,10.88, 72.6,10.86],
  [73,10.18, 73.18,10.12, 73.2,9.92, 73.02,9.9],
  [72.18,8.48, 72.34,8.42, 72.36,8.24, 72.18,8.26]]
};

/* ============================================================
   DATA — STATES
   Add a new state by dropping an entry in here. Anything with a
   `stories` array becomes clickable; everything else opens the
   "not filed yet" panel automatically.
   ============================================================ */
const STATES = {
"jammu-kashmir":{name:"Jammu &amp; Kashmir",plain:"Jammu & Kashmir",ep:"The vale",cap:"Srinagar / Jammu",a:"#7C93A8"},
"ladakh":{name:"Ladakh",ep:"High desert",cap:"Leh",a:"#93A0AB"},
"himachal-pradesh":{name:"Himachal Pradesh",ep:"Hill country",cap:"Shimla",a:"#5C8090"},
"punjab":{name:"Punjab",ep:"Five rivers",cap:"Chandigarh",a:"#B8813B"},
"haryana":{name:"Haryana",ep:"The plain",cap:"Chandigarh",a:"#A8894E"},
"delhi":{name:"Delhi",ep:"The capital",cap:"New Delhi",a:"#C24A46"},
"uttarakhand":{name:"Uttarakhand",ep:"Source of rivers",cap:"Dehradun",a:"#6E8A6A"},
"uttar-pradesh":{name:"Uttar Pradesh",ep:"The heartland",cap:"Lucknow",a:"#C05A2A"},
"rajasthan":{name:"Rajasthan",ep:"Desert kingdoms",cap:"Jaipur",a:"#D98A3B"},
"gujarat":{name:"Gujarat",ep:"The long coast",cap:"Gandhinagar",a:"#C9A227"},
"madhya-pradesh":{name:"Madhya Pradesh",ep:"The centre",cap:"Bhopal",a:"#8C6A3F"},
"chhattisgarh":{name:"Chhattisgarh",ep:"Forest and ore",cap:"Raipur",a:"#7B4B2A"},
"jharkhand":{name:"Jharkhand",ep:"The plateau",cap:"Ranchi",a:"#5E6B3A"},
"bihar":{name:"Bihar",ep:"River country",cap:"Patna",a:"#9C7B2E"},
"west-bengal":{name:"West Bengal",ep:"Delta and hills",cap:"Kolkata",a:"#2F5E7E"},
"sikkim":{name:"Sikkim",ep:"The ridge",cap:"Gangtok",a:"#5B8F7A"},
"assam":{name:"Assam",ep:"The Brahmaputra",cap:"Dispur",a:"#4A7A4A"},
"meghalaya":{name:"Meghalaya",ep:"Cloud plateau",cap:"Shillong",a:"#4E8070"},
"arunachal-pradesh":{name:"Arunachal Pradesh",ep:"First light",cap:"Itanagar",a:"#3E6E5E"},
"nagaland":{name:"Nagaland",ep:"The hills",cap:"Kohima",a:"#6A8F5E"},
"manipur":{name:"Manipur",ep:"The valley",cap:"Imphal",a:"#8A6E4A"},
"mizoram":{name:"Mizoram",ep:"Ridge villages",cap:"Aizawl",a:"#5E7F8A"},
"tripura":{name:"Tripura",ep:"Border country",cap:"Agartala",a:"#A0674A"},
"odisha":{name:"Odisha",ep:"Temple coast",cap:"Bhubaneswar",a:"#2E6F6B"},
"maharashtra":{name:"Maharashtra",ep:"Deccan and sea",cap:"Mumbai",a:"#A6322E"},
"goa":{name:"Goa",ep:"The small coast",cap:"Panaji",a:"#C08A4A"},
"karnataka":{name:"Karnataka",ep:"Plateau and shore",cap:"Bengaluru",a:"#B4603F"},
"telangana":{name:"Telangana",ep:"The high Deccan",cap:"Hyderabad",a:"#7A5C86"},
"andhra-pradesh":{name:"Andhra Pradesh",ep:"The eastern shore",cap:"Amaravati",a:"#6E7F3F"},
"tamil-nadu":{name:"Tamil Nadu",ep:"The south",cap:"Chennai",a:"#7E3A56"},
"kerala":{name:"Kerala",ep:"Backwater state",cap:"Thiruvananthapuram",a:"#3F7A55"},
"andaman-nicobar":{name:"Andaman &amp; Nicobar",plain:"Andaman & Nicobar",ep:"Bay islands",cap:"Port Blair",a:"#3A6E80"},
"lakshadweep":{name:"Lakshadweep",ep:"Coral atolls",cap:"Kavaratti",a:"#4E8A8A"}
};

/* ============================================================
   DATA — DISPATCHES (fictional demo content)
   D(key, population, districts, standfirst, city markers, artwork
   motif, artwork anchor, rows) — every row is one dispatch:
   [category, date, read, byline, headline, standfirst, para, para]
   ============================================================ */
function D(k,pop,dist,stand,marks,motif,art,rows){
  const s = STATES[k];
  s.stand = stand;
  s.marks = marks;
  s.motif = motif;
  if(art) s.art = art;
  s.stories = rows.map(r=>({cat:r[0],date:r[1],read:r[2],by:r[3],h:r[4],dek:r[5],body:[r[6],r[7]]}));
  s.facts = [["Population",pop],["Districts",dist],["Capital",s.cap],
             ["Filed",s.stories.length+" dispatches"]];
}

D("jammu-kashmir","14M","20",
 "Two capitals, one summer and one winter, and an administration still working out what a union territory is allowed to decide for itself.",
 [["Srinagar",74.80,34.08],["Jammu",74.86,32.73],["Anantnag",75.15,33.73]],"peaks",{s:0.60,y:0.14},[
 ["Economy","16 Sep","6 min","Ruhi Andrabi","Horticulture cold chain finally reaches the orchard gate",
  "Twelve new controlled-atmosphere stores in the valley let growers hold apples past the glut. The fruit mandis are still setting the terms.",
  "A grower who once sold at whatever the October price happened to be can now hold stock into February. Roughly a fifth of the valley's crop went into store this season.",
  "The commission agents have adjusted. Advances are smaller, contracts longer, and the argument has moved from price to who pays the electricity bill on the chiller."],
 ["Tourism","14 Sep","7 min","Imtiyaz Wani","The valley's season stretches into a second winter month",
  "Snow arriving later has pushed the Gulmarg ski calendar into March. Hoteliers are pleased; the people who read the snowpack are not.",
  "Occupancy figures for the last two seasons show the shoulder weeks doing the work the peak once did. Bookings now spread across eleven weeks instead of six.",
  "Hydrologists tracking the Jhelum's spring flow describe the same data less happily. A later, thinner snowpack is a longer season and a shorter river."],
 ["Politics","12 Sep","5 min","Nadia Qadri","Delimitation's arithmetic arrives at the panchayat level",
  "Redrawn constituencies are now filtering down into block and panchayat boundaries, and local bodies are discovering they represent different places.",
  "The exercise was framed as housekeeping. In practice it merges wards that have never shared a budget line or a road-repair contractor.",
  "Panchayat heads across four districts have asked for a year's grace before the next devolution cycle. The administration has offered six months."],
 ["Infrastructure","10 Sep","6 min","Bashir Lone","All-weather road links are changing who counts as remote",
  "Tunnels have cut the Srinagar–Jammu run to under five hours in good weather. The towns in between are recalculating what they are for.",
  "Places that lived on stranded traffic — tea, repairs, a bed for the night — now watch it pass. Two have applied for logistics-park status instead.",
  "The road's own engineers are candid that the harder problem is slope stability above it, not capacity on it."]]);

D("ladakh","0.3M","7",
 "The largest district in the country by area and one of the smallest by population, arguing about who gets to write its land and employment rules.",
 [["Leh",77.58,34.16],["Kargil",76.13,34.56],["Diskit",77.55,34.55]],"peaks",{s:0.58,y:0.15},[
 ["Politics","15 Sep","6 min","Tsering Angmo","The Sixth Schedule demand returns to the negotiating table",
  "Hill councils in Leh and Kargil have filed a joint position for the first time, asking for constitutional protection over land, jobs and cultural practice.",
  "The two councils have rarely agreed on anything in public. A shared draft, circulated in August, runs to nine pages and concedes very little.",
  "Officials describe the talks as exploratory. The councils describe them as the only item on the agenda."],
 ["Environment","13 Sep","7 min","Stanzin Dorje","Glacier-fed villages take their water accounting seriously",
  "Artificial ice reservoirs now supply spring irrigation to more than forty settlements. The measurements matter more than the ice.",
  "Each structure stores winter stream water as a cone that melts exactly when the barley needs it. Volumes are logged by village committees and published.",
  "The engineering is simple and old. The data set it has produced is the most detailed record of high-altitude water stress anyone here has kept."],
 ["Economy","11 Sep","5 min","Rigzin Namgyal","Solar capacity is outgrowing the wire that carries it",
  "Ladakh's irradiance is the best in the country. Its transmission corridor is a single line, and everything queues behind it.",
  "Projects cleared on paper are waiting on evacuation capacity that will not exist for several years. Developers have begun asking about storage instead.",
  "Local demand is a fraction of what the plateau could generate, which makes every megawatt an export question first."],
 ["Culture","08 Sep","6 min","Deachen Palmo","Monastery archives are being read by their own communities",
  "A cataloguing project has put several thousand manuscripts into a searchable register, run by the gompas rather than by visiting scholars.",
  "Monks trained in the last three years now do the photography, the indexing and the condition reports themselves.",
  "The first practical result has been mundane and useful: four monasteries discovered they hold duplicate texts and have started lending."]]);

D("himachal-pradesh","7.5M","12",
 "A state that sells water, apples and altitude, and spends most of its administrative energy on the roads that connect all three.",
 [["Shimla",77.17,31.10],["Dharamshala",76.32,32.22],["Manali",77.19,32.24]],"peaks",{s:0.58,y:0.12},[
 ["Environment","16 Sep","7 min","Aarti Thakur","After the landslides, a slope-by-slope audit of the hill roads",
  "Engineers are re-surveying cut slopes along three national highways. The findings are changing how new alignments are approved.",
  "Nearly a third of the audited cuts were steeper than the design standard allowed, most of them widened after the original approval.",
  "The department has begun refusing widening requests without a fresh geotechnical report, which has slowed eleven projects."],
 ["Economy","14 Sep","6 min","Vikram Chauhan","Apple growers move to high-density planting, with reservations",
  "Dwarf rootstock orchards crop in three years instead of eight. The catch is that they need irrigation the old orchards never did.",
  "Early adopters in Kinnaur report yields per hectare roughly double the traditional standard, provided water arrives on schedule.",
  "Growers on rain-fed slopes are watching rather than converting. Their calculation is about drought years, not average ones."],
 ["Tourism","12 Sep","5 min","Nisha Verma","Vehicle caps arrive in the hill towns, quietly",
  "Manali and Shimla have begun limiting daily entries during peak weeks. The scheme is deliberately unadvertised.",
  "Authorities set the cap using parking capacity rather than headline visitor numbers, which is why nobody has published a figure.",
  "Hotel associations were initially opposed and are now the loudest defenders, having discovered that a full town books better than a jammed one."],
 ["Energy","09 Sep","6 min","Rohit Sharma","Small hydro's share is falling and nobody planned for it",
  "Run-of-river projects built in the 2010s are generating below projection as stream flows shift. The state's revenue model assumed otherwise.",
  "Several plants now run at partial capacity through what used to be their strongest months.",
  "The tariff agreements were written for a hydrology that the last decade has not delivered, and renegotiation is the only remedy on the table."]]);

D("punjab","31M","23",
 "The state that fed the country through the Green Revolution and is now being asked to change the crop that made it possible.",
 [["Ludhiana",75.85,30.90],["Amritsar",74.87,31.63],["Patiala",76.40,30.34]],"river",{s:0.62,y:0.14},[
 ["Agriculture","16 Sep","7 min","Manpreet Gill","The paddy-to-maize switch stalls at the mandi",
  "Diversification incentives are in place and the agronomy works. What is missing is a guaranteed buyer at a known price.",
  "Farmers who trialled maize last season report comparable margins only where a processor contracted the crop in advance.",
  "Without assured procurement the switch is a private bet against a public guarantee, and almost nobody is taking it."],
 ["Environment","14 Sep","6 min","Harleen Kaur","Groundwater blocks slip from 'critical' to 'over-exploited'",
  "Water-table readings in central Punjab have fallen again. The map of safe blocks is now smaller than the map of unsafe ones.",
  "Submersible pumps in several districts are being deepened by a few metres every second or third year, a cost that compounds quietly.",
  "The state's own assessment is blunt about the trajectory. The remedies it lists are all slower than the decline it measures."],
 ["Economy","11 Sep","5 min","Gurpreet Sandhu","Ludhiana's hosiery cluster retools for a shorter season",
  "Warmer winters have compressed the selling window for knitwear. The cluster is moving to lighter blends and faster runs.",
  "Units that once took eight-week orders now quote three. Fabric buying has shifted from bulk to rolling.",
  "The bigger firms have absorbed it. The job-work shops that supply them are carrying the inventory risk instead."],
 ["Culture","08 Sep","6 min","Simran Bedi","Village libraries become the state's quiet infrastructure",
  "More than a thousand reading rooms have opened in rural Punjab since 2020, most funded by diaspora families and run by local committees.",
  "The buildings are small and the collections uneven, but the opening hours are long and the electricity is reliable.",
  "Their unplanned function has turned out to be exam preparation, which is what most of the people inside are doing."]]);

D("haryana","30M","22",
 "Wheat, wrestling academies and a corporate skyline that grew on farmland — a state whose two halves are measured in different currencies.",
 [["Gurugram",77.03,28.46],["Faridabad",77.32,28.41],["Hisar",75.72,29.15]],"fort",{s:0.58,y:0.20},[
 ["Cities","16 Sep","6 min","Anjali Yadav","Gurugram's drainage master plan meets its own topography",
  "A decade of building on natural drains has left the city solving in concrete what the land used to do for free.",
  "The revised plan restores three stormwater channels and buys back land along a fourth, which is where the cost sits.",
  "Engineers say the design storm has been revised upward twice since 2019, and expect to revise it again."],
 ["Sport","14 Sep","5 min","Rakesh Phogat","The akhara pipeline adds a sports-science layer",
  "Village wrestling academies that produced a generation of medallists are adding physiotherapists and load monitoring.",
  "Coaches who trained on volume alone have been the hardest to convince, and the most effective once convinced.",
  "Injury data collected over two seasons is now being shared between eleven academies, which is new."],
 ["Agriculture","11 Sep","6 min","Dinesh Malik","Direct seeding of rice spreads where the canal arrives late",
  "Farmers at the tail end of canal systems have adopted dry seeding faster than anyone at the head, for reasons of timing rather than water saving.",
  "The technique gets the crop in before the monsoon rather than waiting for a release that may not come.",
  "Yields are slightly lower and weed pressure higher, which the adopters treat as the price of certainty."],
 ["Politics","09 Sep","5 min","Suman Rathee","Panchayat reservation rules face their second election cycle",
  "Rules reserving seats for women and backward classes are producing a cohort of second-term sarpanches who now know the budget lines.",
  "Researchers tracking the same forty panchayats since 2016 report the sharpest change in water and school spending.",
  "The pattern is not universal. Where a seat rotates every term, the learning resets with it."]]);

D("delhi","21M","11",
 "A city that is also a state that is also a capital, arguing with itself about air, water and who signs which file.",
 [["New Delhi",77.21,28.61],["Najafgarh",76.98,28.61],["Narela",77.09,28.85]],"arch",{s:0.70,y:0.26},[
 ["Environment","17 Sep","7 min","Kabir Sethi","The winter air plan is published in September for once",
  "Emergency measures have been announced before the season rather than during it, which changes what enforcement can look like.",
  "Construction dust rules, fuel switching at industrial units and a fleet audit are all scheduled rather than triggered.",
  "The unresolved part remains the same as every year: most of the particulate load arrives from outside the city's jurisdiction."],
 ["Cities","15 Sep","6 min","Ritu Bhargava","Yamuna floodplain restoration runs into its own maps",
  "Biodiversity parks have reclaimed several stretches of floodplain. Deciding where the floodplain legally ends is the slower work.",
  "Survey records, satellite imagery and revenue maps disagree by hundreds of metres in places, all of them built on.",
  "The restored stretches have measurably improved groundwater recharge, which is the argument the project now leads with."],
 ["Transport","12 Sep","5 min","Aman Khurana","Bus ridership overtakes its pre-pandemic peak",
  "Electrification and a flat fare have pushed daily bus trips past their old ceiling, while metro growth has flattened.",
  "The buses are cheaper and now reliable enough that the trade-off has shifted for short trips.",
  "Depot charging capacity is the constraint. Two depots are running fleets larger than their connections were designed for."],
 ["Culture","10 Sep","6 min","Shreya Kapoor","The city's stepwells get a second life as public space",
  "Restoration of three baolis has turned archaeological sites into evening spaces, which was not the original brief.",
  "Conservation architects wanted stabilisation. The neighbourhoods wanted somewhere to sit, and largely got it.",
  "Footfall data has been used to argue for four more, with lighting and access budgeted from the start this time."]]);

D("uttarakhand","11M","13",
 "Source of two rivers that organise half a subcontinent, and a state that has to decide how many people its slopes can carry.",
 [["Dehradun",78.03,30.32],["Haridwar",78.16,29.95],["Nainital",79.45,29.38]],"peaks",{s:0.60,y:0.12},[
 ["Environment","16 Sep","7 min","Meera Negi","Joshimath's subsidence study becomes a template",
  "The instrumentation installed after the 2023 cracks is now a permanent monitoring network, and four other towns have asked for one.",
  "Ground movement is logged continuously and published monthly, which has changed how construction permissions are argued locally.",
  "The study's uncomfortable finding is that the loading, not the geology, is the variable anyone can still control."],
 ["Tourism","14 Sep","6 min","Pankaj Rawat","Char Dham registration caps hold for a second season",
  "Daily limits at the four shrines were expected to be quietly relaxed. They were not, and the pilgrimage has adjusted around them.",
  "Arrivals are more evenly spread across the season, and the mountain towns report fewer days of total gridlock.",
  "Tour operators who built around peak-week volume have been the loudest objectors and the slowest to adapt."],
 ["Economy","11 Sep","5 min","Deepa Bisht","Hill migration reverses, slightly, and mostly on paper",
  "Census-adjacent surveys show a small net return to some hill blocks. Whether the returnees stay through a winter is the open question.",
  "Remote work and homestay income explain most of the movement, concentrated in a handful of accessible valleys.",
  "Blocks without road access or a functioning school show no reversal at all."],
 ["Culture","09 Sep","6 min","Harish Joshi","Village temple carpentry finds apprentices again",
  "A documentation project has turned into a training programme, with restoration contracts going to local carpenters rather than outside firms.",
  "The joinery used in Kumaoni temples was undocumented until three years ago and is now taught from measured drawings.",
  "Eleven apprentices have completed the course. Two have gone back to a trade their fathers left."]]);

D("uttar-pradesh","241M","75",
 "Two hundred and forty million people, four river systems and the country's densest grid of small cities. Uttar Pradesh rarely moves quietly — when it changes its mind about anything, the rest of India reads the result.",
 [["Agra",78.02,27.18],["Lucknow",80.95,26.85],["Kanpur",80.35,26.45],["Prayagraj",81.85,25.44],["Varanasi",83.01,25.32]],
 "taj",{s:0.72,y:0.30},[
 ["Tourism","16 Sep","7 min","Ira Mahajan","Agra prepares for a new chapter in heritage tourism",
  "A visitor-management plan two years in the drafting would cap crowds at the Taj Mahal, reroute traffic away from the east gate and push the city to sell more than one monument.",
  "The draft circulating among hoteliers this month is less about the monument than about the eleven kilometres around it. Timed entry, a shuttle spine along the Yamuna and a levy on same-day coach tours are all in the text.",
  "Agra's own guides are split. A cap protects the marble and the queue, but it also caps the day's earnings for the roughly forty thousand people who work the heritage economy without a salary."],
 ["Infrastructure","15 Sep","6 min","Devesh Rathi","New expressway corridors redraw the map of eastern Uttar Pradesh",
  "Six-lane links have cut the Lucknow–Ghazipur run to a morning. The harder question is which towns along the route get an exit, and which get a flyover.",
  "Land along the interchanges has repriced three times since the alignment was notified. Districts that expected industrial parks are still waiting for the water and power that would make them usable.",
  "Planners describe the corridor as a spine. The towns describe it as a wall, and the difference between those two readings is now a live political argument."],
 ["Technology","14 Sep","5 min","Sana Qureshi","Lucknow emerges as a growing technology and innovation hub",
  "A cluster of defence-electronics suppliers, a state data centre and cheap graduate hiring have given the capital something it has not had before: a reason for engineers to stay.",
  "The pitch is straightforward. Salaries roughly two-thirds of Bengaluru's, rents roughly a third, and a two-hour flight to either coast. Retention, so far, is the metric that has surprised employers.",
  "What the city still lacks is a second round of capital. Nearly every firm here is profitable and small, and almost none has raised money outside the state."],
 ["Culture","12 Sep","8 min","Rohit Banerji","In Varanasi, the ghats become a year-round stage",
  "Municipal permits for evening performance have quadrupled since 2023, and the city's oldest music families are arguing about what belongs on a riverfront.",
  "The corridor rebuilt around the temple gave the city a plaza it never had. It also gave promoters a venue with a view, and a calendar that no longer empties between festivals.",
  "Older gharanas are not opposed to the audience. They are opposed to the amplification, the ticketing and the forty-minute set."],
 ["Economy","11 Sep","6 min","Meher Sethi","Kanpur's leather belt bets on a cleaner, costlier future",
  "Effluent rules that closed tanneries in 2019 are now the basis of the sector's export pitch. The plants that survived are bigger, fewer and audited by their buyers.",
  "A shared treatment facility at Jajmau processes the load that individual units could never afford to handle. Compliance costs about eleven per cent of margin, and buyers in Europe now ask to see the records.",
  "The employment maths is less comfortable. The belt supports roughly half the workers it did a decade ago, at roughly double the productivity."],
 ["Politics","09 Sep","7 min","Anand Tiwari","A quiet redistricting debate is reshaping local power in the Doab",
  "Ward boundaries in eleven municipal bodies are being redrawn before next year's civic polls. Almost nobody is campaigning on it, and almost everybody is watching it.",
  "The commission's brief is technical: equalise ward populations after a decade of growth on the urban edge. The effect is not technical at all.",
  "Councillors who built careers on a single dense neighbourhood are being handed wards that now stretch into new colonies with entirely different demands."]]);

D("rajasthan","82M","50",
 "The largest state by area, most of it dry, running an economy on solar irradiance, tourism and the memory of caravan routes.",
 [["Jaipur",75.79,26.91],["Jodhpur",73.02,26.24],["Udaipur",73.71,24.58]],"fort",{s:0.58,y:0.18},[
 ["Energy","16 Sep","6 min","Pooja Rathore","The desert's solar parks outgrow their land settlements",
  "Rajasthan hosts more installed solar capacity than any other state. The disputes now are about grazing commons, not about panels.",
  "Village councils that leased pasture in the early 2010s are renegotiating as tariffs fall and developers consolidate.",
  "Several districts have begun insisting on revenue-share clauses rather than one-time payments, which developers describe as a material change."],
 ["Environment","14 Sep","7 min","Arun Bhati","Traditional water harvesting is measured, at last",
  "Johads and tankas restored over two decades now have piezometer data attached. The numbers support what the villages have been claiming.",
  "In three catchments, wells within two kilometres of a restored structure hold water roughly two months longer into the dry season.",
  "The finding has changed how the state's watershed budget is allocated, away from single large works and toward dense small ones."],
 ["Tourism","12 Sep","6 min","Nidhi Shekhawat","Heritage hotels confront their own conservation bills",
  "Converted forts and havelis carried tourism through the lean years. The structures are now due the repairs that tariffs were meant to fund.",
  "Lime plaster, stone replacement and drainage are expensive and unglamorous, and none of it photographs well.",
  "A state conservation subsidy announced in July requires matching private spend, which the smaller properties say they cannot raise."],
 ["Economy","09 Sep","5 min","Vikas Jangid","Marble and sandstone clusters clean up under buyer pressure",
  "Export buyers now audit slurry disposal at quarries in Rajsamand and Kishangarh. Compliance has become a commercial requirement.",
  "Slurry that was dumped for decades is being reprocessed into board and tile by a handful of new units.",
  "The reprocessing margin is thin, and it exists only because disposal is now expensive."]]);

D("gujarat","71M","33",
 "Sixteen hundred kilometres of coastline, the country's busiest cargo ports and a manufacturing belt that treats logistics as a competitive sport.",
 [["Ahmedabad",72.58,23.02],["Surat",72.83,21.17],["Rajkot",70.80,22.30]],"port",{s:0.52,y:0.10},[
 ["Business","16 Sep","6 min","Hetal Desai","Surat's diamond district diversifies into lab-grown stones",
  "Polishing units that cut mined rough for forty years are now running parallel lines for synthetics, and the export code has had to catch up.",
  "Lab-grown volume from the cluster has risen sharply while the value per carat has fallen, which makes revenue comparisons unhelpful.",
  "The workforce question is the sharp one: synthetics need fewer hands per carat, and the cluster employs several hundred thousand of them."],
 ["Infrastructure","14 Sep","7 min","Jignesh Patel","Port-led logistics parks push inland along the freight corridor",
  "Container volumes at Mundra and Kandla have outgrown their immediate hinterland. The response is a chain of inland yards up the corridor.",
  "Dedicated freight track has cut the Mundra–Delhi transit time enough that shippers now treat inland yards as extensions of the quay.",
  "Land acquisition for the third yard has been slower than the rail, which is the usual sequence in reverse."],
 ["Environment","11 Sep","6 min","Rina Solanki","Mangrove cover grows, and the accounting gets careful",
  "Gujarat holds the second-largest mangrove area in the country and is adding to it. The new plantations are being audited for survival, not planting.",
  "Three-year survival rates in the Gulf of Kachchh plantings are being published for the first time, and they vary widely by site.",
  "Where creek hydrology was restored first, survival is roughly double. Where saplings went into unmodified mudflat, most did not last a monsoon."],
 ["Culture","09 Sep","5 min","Bhavna Trivedi","Kutch weaving cooperatives set their own price floor",
  "Artisan groups in Bhuj have agreed a minimum rate card for hand-woven work, and the buyers have largely accepted it.",
  "The card covers loom time rather than finished pieces, which is what made it possible to agree at all.",
  "Volumes dipped for a season and recovered. Several cooperatives report their first year of rising per-weaver income since 2019."]]);

D("madhya-pradesh","87M","55",
 "The geographic centre of the country, holding a third of its tiger habitat and a river system that four other states argue about.",
 [["Bhopal",77.41,23.26],["Indore",75.86,22.72],["Jabalpur",79.93,23.18]],"fort",{s:0.62,y:0.22},[
 ["Environment","16 Sep","7 min","Kavita Chouhan","Tiger numbers rise and the corridors do not",
  "Madhya Pradesh holds the largest tiger population in the country. Its reserves are increasingly islands connected by disputed land.",
  "Camera-trap data shows young males dispersing into farmland because the forest routes between reserves are broken in eleven places.",
  "Corridor notification would restrict mining and highway alignment, which is why the corridor maps have been under review for six years."],
 ["Agriculture","14 Sep","6 min","Sunil Dangi","Soy belt farmers hedge back toward pulses",
  "A run of erratic Septembers has made soybean a gamble at the moment of harvest. Acreage is shifting, quietly and unevenly.",
  "Pulses tolerate a late monsoon better and fetch a price that the state procures, which soybean growers have noticed.",
  "The processing industry built around soy is lobbying hard, because its crushing capacity assumes an acreage that is no longer guaranteed."],
 ["Economy","11 Sep","5 min","Alka Mishra","Indore's waste system becomes an export product",
  "The city's segregation model is now being licensed to municipalities in four other states, with staff seconded to run the first year.",
  "The transferable part turned out to be the route planning and the enforcement calendar, not the equipment.",
  "Cities that bought the trucks without the supervision structure have not replicated the results."],
 ["Culture","08 Sep","6 min","Ramesh Baghel","Bundelkhand's stepwells get a water-department budget",
  "Historic baolis are being restored as functioning water infrastructure rather than as monuments, with a line item to match.",
  "Seventeen structures have been desilted and reconnected to their catchments. Six now supply usable water through May.",
  "The archaeology department objected to the modifications and was overruled, which the engineers concede may prove short-sighted."]]);

D("chhattisgarh","31M","33",
 "Forest, coal and iron ore in roughly equal measure, and a long argument about who the revenue from all three belongs to.",
 [["Raipur",81.63,21.25],["Bilaspur",82.15,22.08],["Jagdalpur",82.02,19.08]],"fort",{s:0.56,y:0.18},[
 ["Economy","16 Sep","6 min","Sujata Netam","Tendu leaf rates rise and the collection season shortens",
  "Minor forest produce rates were revised upward this year. Collectors report the higher rate arriving alongside a shorter, hotter picking window.",
  "Roughly a million households in the state depend on some part of the forest-produce calendar for a share of annual income.",
  "The cooperative federation now publishes daily rates by district, which has narrowed the gap between what traders and societies pay."],
 ["Environment","14 Sep","7 min","Anil Kashyap","Hasdeo's coal blocks and the community-consent question",
  "Gram sabha resolutions opposing new mining in the Hasdeo Arand forest have been passed, contested and passed again.",
  "The legal question is whether consent recorded under forest-rights law binds a mining clearance issued under a different statute.",
  "Both sides now cite the same Supreme Court language, which is generally a sign that the matter will be back in court."],
 ["Infrastructure","11 Sep","5 min","Deepak Sahu","Bastar's road programme reaches the last blocks",
  "Blocks that had no metalled road a decade ago now have one. What arrives with it is being watched closely by the people who asked for it.",
  "Health referral times in three districts have fallen sharply, which is the outcome the programme was defended on.",
  "Market access has cut both ways: prices for forest produce improved, and outside traders arrived first."],
 ["Culture","09 Sep","6 min","Priyanka Markam","Bastar's iron casters find a market that pays for time",
  "Dhokra casting has moved from tourist-stall pricing to commissioned work, and the makers are choosing which commissions to take.",
  "A cooperative in Kondagaon now quotes by casting weeks rather than by piece, which has roughly tripled realised prices.",
  "The constraint is apprenticeship. There are fewer than sixty casters working at the level the commissions require."]]);

D("jharkhand","40M","24",
 "A plateau that supplies the country's steel and carries the highest mineral royalty receipts per capita, without the roads to show for it.",
 [["Ranchi",85.31,23.34],["Jamshedpur",86.20,22.80],["Dhanbad",86.43,23.80]],"fort",{s:0.58,y:0.20},[
 ["Economy","16 Sep","6 min","Sanjay Oraon","District mineral funds face their first serious audit",
  "Royalty-funded district trusts hold substantial balances. An audit of four districts has asked where the money actually went.",
  "The rules require spending in mining-affected areas. The audit found a majority of sanctioned works in district headquarters instead.",
  "Trust boards have been asked to re-map affected wards before the next sanction cycle, which will take most of a year."],
 ["Environment","14 Sep","7 min","Nivedita Munda","Jharia's underground fires burn into a second century",
  "Coalfield fires that began in 1916 are still moving. The relocation programme is now larger than the mining operation above it.",
  "Subsidence surveys have expanded the unsafe zone twice since 2021, each time adding settlements to the list.",
  "Families offered housing outside the field often return, because the work has not moved with them."],
 ["Business","11 Sep","5 min","Amit Tirkey","Jamshedpur's supplier base moves up the value chain",
  "Component firms that made castings for a single steel buyer are now shipping machined assemblies to three sectors.",
  "The shift required tooling investment that only a handful of the older units could finance.",
  "Those that made it report margins roughly double their casting business and order books that no longer track one customer's cycle."],
 ["Culture","09 Sep","6 min","Rashmi Horo","Sohrai painting gets a geographic indication and a problem",
  "Wall painting from the Hazaribagh belt now carries a GI tag. Enforcement is proving harder than registration.",
  "Printed reproductions sold as handmade have appeared in three metro markets, and the registry has no field staff.",
  "Artist collectives have started issuing their own certificates, which is what the tag was supposed to make unnecessary."]]);

D("bihar","128M","38",
 "The most densely populated state in the country, rebuilt every year by rivers that arrive from Nepal and leave through Bengal.",
 [["Patna",85.14,25.59],["Gaya",85.00,24.79],["Muzaffarpur",85.39,26.12]],"river",{s:0.55,y:0.22},[
 ["Environment","16 Sep","7 min","Shalini Jha","The Kosi's embankments hold, and the silt keeps rising",
  "A flood season without a major breach is now unusual enough to report. The riverbed inside the embankments has risen again.",
  "Cross-section surveys show the channel perched several metres above the surrounding fields in three reaches.",
  "Engineers describe the structure as buying time. The disagreement is about what the time is being used for."],
 ["Economy","14 Sep","6 min","Rajeev Ranjan","Makhana moves from pond to processing line",
  "Fox-nut cultivation in the Mithila belt has a GI tag, an export code and, for the first time, mechanised popping units.",
  "Manual popping is skilled, hot and badly paid. The machines change the labour question more than the yield question.",
  "Growers now sell graded output rather than raw nut, which has roughly doubled the share of value staying in the district."],
 ["Education","11 Sep","6 min","Nutan Kumari","Coaching towns spread beyond Patna",
  "Test-preparation clusters have appeared in half a dozen district towns, following cheap rent and returning teachers.",
  "The model runs on hostel occupancy as much as tuition, which is why the buildings arrived before the faculty.",
  "Regulators have begun asking for fee transparency, prompted less by students than by the banks financing the hostels."],
 ["Politics","08 Sep","5 min","Ashok Prasad","Panchayat finance reform reaches the third tier",
  "Untied funds now reach gram panchayats directly. The accounting capacity to spend them has not arrived at the same speed.",
  "Several thousand panchayats ended the year with unspent balances and an audit query rather than a road.",
  "Block-level accountants have been sanctioned. Recruitment is the step that has slipped twice."]]);

D("west-bengal","100M","23",
 "A delta, a coalfield and a Himalayan ridge inside one boundary, joined by a corridor twenty kilometres wide.",
 [["Kolkata",88.36,22.57],["Siliguri",88.43,26.73],["Durgapur",87.32,23.52]],"river",{s:0.50,y:0.28},[
 ["Environment","16 Sep","7 min","Ananya Ghosh","The Sundarbans measures its own retreat",
  "Island-by-island erosion data collected by local volunteers now covers fifteen years, and it is more granular than the official series.",
  "Four inhabited islands have lost more than a fifth of their area in that period, mostly on the seaward faces.",
  "Embankment repair follows a schedule set in Kolkata. The volunteers' maps show where the next breach is likely, and rarely match it."],
 ["Economy","14 Sep","6 min","Sourav Dutta","Kolkata's leather cluster clears its effluent backlog",
  "Common treatment capacity at Bantala has been expanded after a decade of notices. Tanneries are being metered individually for the first time.",
  "Metering has already changed behaviour: water use per hide has fallen because it now appears on a bill.",
  "The cluster's export buyers have started asking for the discharge data directly, which is a faster enforcement mechanism than the notices were."],
 ["Culture","11 Sep","6 min","Piyali Sen","Durga Puja's heritage listing changes the commissioning season",
  "UNESCO recognition has professionalised the pandal economy. Artists now sign contracts in February for work delivered in October.",
  "Budgets for the largest pujas have risen faster than the fees paid to the people who build them, which is now a public argument.",
  "A collective of art directors published a rate card this year. Roughly a third of the big committees have adopted it."],
 ["Infrastructure","09 Sep","5 min","Tanmoy Roy","The Siliguri corridor gets a second road",
  "Everything moving between the Northeast and the rest of the country passes through a narrow neck. A parallel alignment is finally under construction.",
  "The existing highway carries freight, tourism and military traffic on the same two lanes through a town centre.",
  "The new alignment bypasses the town, which the town's traders have opposed for eleven years and have now stopped opposing."]]);

D("sikkim","0.7M","6",
 "The smallest state by population, entirely organic by law, and the country's cleanest experiment in what a mountain economy can be.",
 [["Gangtok",88.61,27.33],["Namchi",88.35,27.17],["Pelling",88.24,27.30]],"peaks",{s:0.58,y:0.12},[
 ["Agriculture","16 Sep","6 min","Pema Lepcha","A decade on, the organic mandate counts its costs",
  "Sikkim banned chemical inputs in 2016. Yields fell, premiums arrived late, and the policy survived both.",
  "Large cardamom and ginger now command certified prices that make the arithmetic work for export crops.",
  "Cereal growers, who have no premium market, carried the yield loss without compensation and remain the policy's weakest point."],
 ["Environment","14 Sep","7 min","Karma Bhutia","Glacial lake monitoring expands after South Lhonak",
  "The 2023 outburst flood destroyed a dam and rewrote the hazard register. Twelve more lakes are now instrumented.",
  "Early-warning sirens have been installed in four valley settlements, with drills run twice a year.",
  "The harder question is what the warning time actually is, and the honest answers are measured in minutes."],
 ["Tourism","11 Sep","5 min","Dechen Subba","Homestays overtake hotels in registered beds",
  "Village homestay registration has grown fast enough that the state now has more family-run beds than commercial ones.",
  "The licensing regime was deliberately light, which produced the growth and also the inconsistency.",
  "A grading scheme introduced this year is voluntary, and roughly half the registered homestays have signed up."],
 ["Culture","08 Sep","6 min","Sonam Gyatso","Lepcha language teaching returns to primary school",
  "A curriculum built with community elders is now taught in state schools in four subdivisions.",
  "The script had fewer than a thousand fluent readers by most estimates when the project began.",
  "Teacher supply is the constraint, and the first cohort trained specifically for it graduates next year."]]);

D("assam","36M","35",
 "A valley built by one river, carrying half the country's tea and most of its arguments about who belongs where.",
 [["Guwahati",91.74,26.14],["Dibrugarh",94.90,27.47],["Silchar",92.80,24.83]],"river",{s:0.42,y:0.10},[
 ["Environment","16 Sep","7 min","Bornali Saikia","Brahmaputra erosion swallows another eight villages",
  "Bank erosion, not flooding, is the river's most permanent damage. The land it takes is not returned when the water drops.",
  "Satellite comparison shows the channel widening in five reaches, with char islands forming and dissolving on a yearly cycle.",
  "Compensation rules cover flood loss and not erosion loss, which is a distinction the affected districts have been contesting for years."],
 ["Economy","14 Sep","6 min","Pranab Gogoi","Tea gardens face a wage bill and a weather bill at once",
  "A revised daily wage for garden workers arrives in a season when the second flush was short and the auction price soft.",
  "Smallholder growers, who now supply a majority of the state's leaf, are outside the wage agreement and undercutting it.",
  "The bought-leaf factories in between are where the pressure is landing, and several have cut collection days."],
 ["Culture","11 Sep","6 min","Rituparna Das","Majuli's satras document themselves",
  "Monastic institutions on the river island have begun digitising manuscripts and mask-making techniques as the island shrinks.",
  "Four satras have relocated in living memory. The archives have moved with them, sometimes twice.",
  "The project has produced the first complete inventory of what the island's institutions actually hold."],
 ["Infrastructure","09 Sep","5 min","Hiren Barua","River transport returns to the Brahmaputra, slowly",
  "Cargo terminals at Pandu and Jogighopa have reopened to scheduled barge traffic after a long gap.",
  "Dredging cost and seasonal draft remain the reason most shippers still use the road.",
  "For heavy, non-urgent cargo the economics now work, which is a narrower use case than the terminals were built for."]]);

D("meghalaya","3.4M","12",
 "A plateau that receives more rain than almost anywhere on earth and spends the dry months looking for water.",
 [["Shillong",91.88,25.57],["Tura",90.22,25.51],["Cherrapunji",91.72,25.30]],"peaks",{s:0.55,y:0.10},[
 ["Environment","16 Sep","7 min","Wanda Kharkongor","The wettest place on earth runs dry in March",
  "Sohra receives eleven metres of rain a year and pipes drinking water in during the dry season. The plateau does not hold what falls on it.",
  "Deforestation and quarrying have reduced infiltration on the catchment slopes, and the springs that villages relied on are failing earlier.",
  "Spring-shed mapping now covers sixty catchments, and the restoration work is being done by the village councils that own the land."],
 ["Culture","14 Sep","6 min","Banri Syiem","Living root bridges enter a conservation register",
  "Bridges grown from fig roots over decades are being mapped and their maintenance traditions recorded before the knowledge thins.",
  "More than a hundred structures have been documented, with growth histories taken from the families who tend them.",
  "Visitor pressure at the best-known ones has already required rebuilding of approach paths, which is not a traditional problem."],
 ["Economy","11 Sep","5 min","Donald Marak","Coal's shadow economy meets a new regulatory frame",
  "Scientific mining licences have been issued after a long ban on rat-hole extraction. Compliance is being tested rather than assumed.",
  "Legal output remains a fraction of what the ban was meant to replace.",
  "District administrations report that transport checkpoints, not mine inspections, are doing most of the enforcement."],
 ["Politics","08 Sep","6 min","Ibansuk Lyngdoh","Traditional councils and elected councils share a district",
  "Dorbar shnong and autonomous district councils hold overlapping authority over land. A new land-records project is forcing the question.",
  "Registering community land in a state register alters what community ownership means, which is the objection.",
  "A pilot in two blocks has proceeded with council consent and a clause that keeps titles collective."]]);

D("arunachal-pradesh","1.6M","25",
 "The first place in the country to see the sun, with more languages than districts and roads arriving in both.",
 [["Itanagar",93.61,27.10],["Tawang",91.86,27.59],["Pasighat",95.33,28.07]],"peaks",{s:0.50,y:0.05},[
 ["Infrastructure","16 Sep","7 min","Tage Nada","The frontier highway reaches its hardest stretch",
  "A road along the northern districts has been under construction for a decade. The remaining sections are the ones that justify it.",
  "Each kilometre through the eastern gorges costs several times the national average and takes two working seasons.",
  "Villages along the alignment have gained day-long access to district headquarters, and lost the isolation that kept their forests intact."],
 ["Environment","14 Sep","6 min","Yapi Riba","Hydropower's cumulative impact gets one assessment",
  "Dozens of projects have been cleared on the Siang and its tributaries individually. A basin-level study is finally under way.",
  "Downstream communities in Assam have pressed for it longer than the state's own districts have.",
  "The study's terms of reference include sediment transport, which previous project-level clearances largely did not."],
 ["Culture","11 Sep","6 min","Moji Riba","Twenty-six tribes, one orthography problem",
  "Languages without a settled script are being written down, and the choice of script has become a political question.",
  "Roman, Devanagari and Tai-derived options are all in use, sometimes for the same language in neighbouring villages.",
  "A state language board has stopped trying to standardise and started funding whichever version a community documents."],
 ["Economy","09 Sep","5 min","Techi Anu","Kiwi and large cardamom find a buyer beyond the state",
  "Horticulture from the western districts now reaches metro markets by air cargo out of a small airport that opened in 2022.",
  "The volumes are trivial nationally and transformative locally.",
  "The constraint is cold storage at the airstrip, which currently fits about a fifth of a day's harvest."]]);

D("nagaland","2.2M","16",
 "Sixteen recognised tribes, a festival that carries the tourism calendar, and a peace process older than most of the people waiting on it.",
 [["Kohima",94.11,25.67],["Dimapur",93.73,25.91],["Mokokchung",94.52,26.32]],"peaks",{s:0.50,y:0.10},[
 ["Politics","16 Sep","6 min","Along Jamir","The framework agreement's unresolved clauses, in public",
  "Nearly a decade after it was signed, the terms of the Naga political agreement are still being disputed in summary form.",
  "The unresolved items are a separate flag and constitution, and neither side has moved publicly.",
  "Tribal hohos have begun issuing their own statements, which had not happened in the earlier rounds."],
 ["Culture","14 Sep","6 min","Vikuolie Rutsa","Hornbill Festival tries to be less of a single week",
  "The December festival carries a disproportionate share of the state's visitor economy. Organisers are trying to spread it.",
  "Village-level events through the year are being funded to build capacity that does not evaporate in January.",
  "The risk, which the organisers acknowledge, is diluting the one event everyone already knows about."],
 ["Agriculture","11 Sep","6 min","Imlisanen Ao","Jhum cycles shorten and the fallow science catches up",
  "Shifting cultivation fallows that once ran twelve years now run five. Soil studies are measuring what that costs.",
  "Yields in the second cropping year have fallen measurably where the cycle is shortest.",
  "Alder-based systems that fix nitrogen during fallow are being revived in two districts, on land that never abandoned them."],
 ["Economy","08 Sep","5 min","Kevi Zhimomi","Dimapur becomes the Northeast's quiet freight node",
  "The state's only rail head handles cargo for three states. Its capacity has become everyone's problem.",
  "Warehousing has grown around it faster than the road that serves it.",
  "A second goods yard has been sanctioned, and the land for it is under acquisition."]]);

D("manipur","3.2M","16",
 "A valley ringed by hills, where almost every question about land, jobs and representation is also a question about which of the two you live in.",
 [["Imphal",93.94,24.82],["Churachandpur",93.68,24.33],["Ukhrul",94.36,25.10]],"peaks",{s:0.55,y:0.12},[
 ["Politics","16 Sep","7 min","Thoibi Devi","Relief camps enter a second year and a third budget",
  "Displacement across the valley and hills has outlasted the emergency framing. Camp administration is now a standing line item.",
  "Schooling for camp children has been the hardest service to restore, and the least reported.",
  "Civil society groups on both sides have begun meeting on logistics, which is the only agenda anyone has agreed to."],
 ["Economy","14 Sep","6 min","Ningthem Singh","Loktak's fishing communities and the hydro reservoir",
  "Water levels held for power generation determine what the lake's phumdi islands do, and therefore what can be fished.",
  "A management authority has been asked to publish its drawdown schedule in advance, which it has begun doing.",
  "Fishing households report that predictability matters more to them than the level itself."],
 ["Culture","11 Sep","6 min","Sanatombi Chanu","Manipuri dance schools reopen on a shorter calendar",
  "Institutions that teach Ras Leela and Thang-Ta have resumed teaching with reduced cohorts and outside funding.",
  "Several senior gurus have been teaching remotely to students who have not returned to the valley.",
  "The repertoire being taught has narrowed to what can be learned without a full ensemble."],
 ["Environment","08 Sep","5 min","Kaka Shimray","Hill terracing gets a state subsidy",
  "Terrace construction in the hill districts is being supported as erosion control rather than as agriculture.",
  "The distinction matters because it opens a different funding window with fewer land-title requirements.",
  "Uptake has been fastest in villages that already had community labour arrangements for the work."]]);

D("mizoram","1.2M","11",
 "Ridge-top villages, near-universal literacy, and a border that runs through families on both sides of it.",
 [["Aizawl",92.72,23.73],["Lunglei",92.73,22.88],["Champhai",93.33,23.47]],"peaks",{s:0.50,y:0.10},[
 ["Politics","16 Sep","6 min","Lalrinpuii Sailo","Cross-border kinship meets a fenced frontier",
  "Free movement along the Myanmar border has been restricted. Families and markets that spanned it are adjusting badly.",
  "The state government has asked for a permit regime rather than a fence, citing shared clan territory.",
  "Trade at the Zokhawthar crossing has fallen sharply, and informal routes have not fully replaced it."],
 ["Agriculture","14 Sep","6 min","Vanlalruata Chhangte","Bamboo flowering's fifty-year clock starts again",
  "The gregarious flowering that triggers rodent booms and famine is due within the decade. Preparation has started early this time.",
  "Bamboo-based industry is being expanded specifically to consume the culms before they die back.",
  "Historical records of the 1959 and 2006 events are being used to model where the flowering front will move first."],
 ["Economy","11 Sep","5 min","Zothanpuii Ralte","The Kaladan corridor waits on the far bank",
  "A multimodal route meant to reach the sea through Myanmar is complete on the Indian side and stalled beyond it.",
  "Road capacity built in anticipation now carries local traffic only.",
  "Planners have begun describing the corridor as a long-term asset, which is a change in tense."],
 ["Culture","08 Sep","6 min","Lalhmangaihi Pachuau","Church choirs become the state's music infrastructure",
  "Congregational singing has produced a recording and arranging scene with no commercial label behind it.",
  "Choir competitions now draw entries from more than four hundred congregations.",
  "The arrangers involved have started writing for secular ensembles, which the churches have taken calmly."]]);

D("tripura","4.2M","8",
 "Surrounded on three sides by another country, closer to Chittagong port than to its own rail head until recently.",
 [["Agartala",91.28,23.83],["Udaipur",91.49,23.53],["Kailashahar",92.01,24.32]],"river",{s:0.55,y:0.10},[
 ["Infrastructure","16 Sep","6 min","Sujit Debbarma","The Agartala–Akhaura link changes the freight map",
  "A short cross-border rail connection puts Tripura within a few hours of a seaport that was always nearby and unreachable.",
  "Cargo that travelled sixteen hundred kilometres through the Siliguri corridor can now travel a fraction of that.",
  "Volumes remain small because the customs infrastructure on both sides is sized for passengers."],
 ["Economy","14 Sep","6 min","Ratna Sarkar","Rubber plantations mature into a processing question",
  "Tripura is the country's second-largest natural rubber producer. Nearly all of it leaves the state unprocessed.",
  "Two crumb-rubber units have been commissioned, which would absorb roughly a fifth of output.",
  "Growers' societies want a price-sharing formula before committing supply, and negotiations are in their third round."],
 ["Culture","11 Sep","6 min","Bikash Jamatia","Bamboo craft moves from handicraft to building material",
  "Treated bamboo from the state is being specified in construction rather than sold as souvenirs.",
  "A treatment plant near Agartala now certifies culms to a structural standard.",
  "Architects in three metros have specified it, which has done more for volumes than a decade of craft fairs."],
 ["Environment","08 Sep","5 min","Priyanka Reang","The state maps its own water bodies",
  "A survey of tanks and ponds has found several thousand more than the revenue records show, many of them silted.",
  "Restoration is being run through village committees with a maintenance clause attached to the grant.",
  "Fish yields are the metric being used, because they are the one the committees already track."]]);

D("odisha","47M","30",
 "Five hundred kilometres of cyclone-exposed coast and the best-drilled evacuation system in the country, built out of one bad night in 1999.",
 [["Bhubaneswar",85.82,20.27],["Rourkela",84.85,22.25],["Puri",85.83,19.81]],"temple",{s:0.55,y:0.20},[
 ["Environment","16 Sep","7 min","Sasmita Behera","Cyclone shelters become year-round buildings",
  "Multipurpose shelters built after 1999 sat empty between storms. Districts have started using them as schools and clinics.",
  "Occupancy keeps the buildings maintained, which is the failure mode single-use shelters always had.",
  "The evacuation protocol has not changed. What has changed is that people know the route to a building they already use."],
 ["Economy","14 Sep","6 min","Pradeep Mohanty","Bauxite royalties and the district that produces them",
  "Odisha mines a large share of the country's bauxite and alumina. The revenue flows upward faster than the infrastructure flows back.",
  "District mineral funds hold significant balances in Koraput and Rayagada, spent mostly on health and road works.",
  "Community consent processes for new leases have become the binding constraint, and both sides now prepare for them years ahead."],
 ["Culture","11 Sep","6 min","Lipsa Panda","Pattachitra painters register their own designs",
  "Artists in Raghurajpur have begun filing design registrations individually rather than relying on a village GI tag.",
  "Mass-printed reproductions had made the collective tag hard to enforce.",
  "Individual registration is expensive and slow, and a cooperative is now filing on members' behalf in batches."],
 ["Infrastructure","09 Sep","5 min","Bibhu Nayak","Paradip's port expansion tests the coastline",
  "Deeper berths mean more dredging, and more dredging means moving sediment that the coast south of the port depends on.",
  "Shoreline change studies commissioned by the port itself show accretion north and erosion south.",
  "Sand bypassing has been proposed and costed. It has not been funded."]]);

D("maharashtra","126M","36",
 "India's largest economy, its loudest stock exchange and its most crowded local train, held together by a state that begins at the Arabian Sea and ends in the cotton fields of Vidarbha.",
 [["Mumbai",72.88,19.08],["Pune",73.86,18.52],["Nashik",73.79,20.00],["Nagpur",79.09,21.15],["Kolhapur",74.24,16.70]],
 "gateway",{s:0.50,y:-0.08},[
 ["Business","16 Sep","7 min","Farah Dalal","Mumbai's financial district plans its next skyline",
  "With the eastern waterfront opening up, the city is deciding whether its next cluster of towers goes to finance, to housing, or to the port workers who were promised both.",
  "Two hundred and sixty hectares of dock land is the largest single parcel the island city has released in a century. Every proposal so far assumes offices at the centre and housing at the edge.",
  "Unions representing port labour have asked for the reverse, and for the first time they have a seat on the planning committee that decides."],
 ["Cities","15 Sep","5 min","Nikhil Salgaonkar","Pune's mobility experiment moves from pilot to policy",
  "Three years of bus lanes, signal priority and a flat fare have produced a measurable thing: the first year since 2011 in which private-vehicle registrations fell.",
  "The corridor along Nagar Road carries more people per hour than the six general lanes beside it. That statistic is now printed on the buses themselves.",
  "Scaling it means taking road space in neighbourhoods that have not yet had the argument, which is where the pilot's political goodwill will actually be tested."],
 ["Technology","13 Sep","6 min","Priya Kulkarni","Nagpur becomes an unlikely testbed for cargo autonomy",
  "Sitting at the intersection of two national corridors, the city has quietly become the place where freight software gets driven for ten thousand kilometres before anyone sees it.",
  "The appeal is geography and boredom: long straight highway, predictable weather, a freight terminal that does not mind an odd fleet.",
  "Drivers in the test convoys are not being replaced, and their union negotiated that clause first. What the systems are learning to do is the last hour of a fourteen-hour shift."],
 ["Culture","12 Sep","8 min","Aditi Rane","The Western Ghats' monsoon festivals find a new audience",
  "Village performance calendars that once emptied in June are now the peak season, and the hill roads are carrying more visitors than the water systems were built for.",
  "Four districts have started issuing weekend permits for the most-visited valleys. The revenue is small; the point is the count.",
  "Performers describe the change carefully. The audience has never been bigger and has never known less about what it is watching."],
 ["Infrastructure","10 Sep","7 min","Zain Merchant","Coastal road, reclaimed edge: the city argues with the sea",
  "The southern stretch has cut a forty-minute commute to twelve. Oceanographers are still publishing on what the reclamation did to the sediment that fed the beaches north of it.",
  "Traffic counts have met projections. Fishing communities at Worli report the loss of a landing beach that no environmental clearance accounted for.",
  "The next phase will be built under a revised coastal-zone rule that the city itself asked for, after losing the first round in court."],
 ["Politics","08 Sep","6 min","Sameer Deshpande","Municipal reform returns to the floor in Nagpur's winter session",
  "A bill to give large municipal corporations their own revenue powers has been drafted four times in nine years. This version arrives with the finance department's signature on it.",
  "Cities currently collect roughly a fifth of what they spend. The rest arrives as transfers, late, and with conditions attached.",
  "Mayors across party lines support the principle. The disagreement, as always, is over which tax the state gives up first."]]);

D("goa","1.6M","2",
 "Two districts, a hundred kilometres of coast and a resident population outnumbered several times over by its visitors.",
 [["Panaji",73.83,15.49],["Margao",73.96,15.28],["Ponda",74.01,15.40]],"coast",{s:0.62,y:0.10},[
 ["Environment","16 Sep","6 min","Rhea Fernandes","Khazan fields, the tidal farming the state forgot",
  "Centuries-old sluice systems that let farmers work saline floodplain are failing where their community management has lapsed.",
  "Roughly a third of the khazan area is now waterlogged or abandoned, which also removes a flood buffer.",
  "A restoration programme has been funded, and the difficult part is reconstituting the village bodies that operated the gates."],
 ["Tourism","14 Sep","5 min","Dinesh Naik","Beach shack licences move to a longer cycle",
  "Annual licensing kept shack operators from investing in anything that could not be dismantled. A five-year term changes that calculus.",
  "Waste handling and toilet provision have been written into the longer licence as conditions.",
  "Operators who have held the same stretch for decades welcomed it. New entrants find the barrier higher."],
 ["Economy","11 Sep","6 min","Savio D'Souza","Mining's long pause reshapes the interior",
  "Iron ore extraction has been suspended for most of a decade. The talukas that lived on it have found partial replacements.",
  "Truck fleets financed on ore haulage were the first casualty and have largely been absorbed into construction.",
  "Auctions for fresh leases are proceeding, and the villages nearest the pits are no longer uniformly in favour."],
 ["Culture","09 Sep","6 min","Maria Pereira","Konkani publishing finds a small, steady floor",
  "Books in Konkani, in both scripts, are being printed in short runs that actually sell out.",
  "Library procurement and school prescription account for most of it, which publishers treat as a stable base rather than a limitation.",
  "The unexpected growth has been in audio, where script choice stops mattering."]]);

D("karnataka","68M","31",
 "The country's software balance sheet, its second-driest farmland and a coastline in between, all reporting to one capital that cannot be reached at rush hour.",
 [["Bengaluru",77.59,12.97],["Mysuru",76.64,12.30],["Hubballi",75.12,15.36]],"fort",{s:0.58,y:0.18},[
 ["Technology","16 Sep","6 min","Divya Rao","Bengaluru's firms start hiring in the second-tier cities",
  "Rent, commute and attrition have pushed a meaningful share of new technology hiring to Mysuru, Hubballi and Mangaluru.",
  "The offices are small, deliberately, and staffed by people who did not want to move to the capital.",
  "Retention in these centres runs well above the Bengaluru average, which is the number finance directors have noticed."],
 ["Environment","14 Sep","7 min","Ravi Kulkarni","Bengaluru's lakes are rehabilitated one catchment at a time",
  "Restoring a lake without fixing its inflow produces a clean tank that fills with sewage. Several projects have now been sequenced properly.",
  "Catchment-first restoration takes roughly three times as long and costs less to maintain afterwards.",
  "Citizen groups hold the monitoring data, and in two cases have used it to stop a handover to a developer."],
 ["Agriculture","11 Sep","6 min","Shashikala Patil","North Karnataka's drought belt turns to millets, again",
  "Government procurement of millets has made an old crop viable on land that never suited sugarcane.",
  "Acreage in four districts has risen for three consecutive seasons, which has not happened since the 1980s.",
  "The processing gap remains: most of the grain is sold raw because dehulling capacity sits elsewhere."],
 ["Culture","09 Sep","6 min","Anand Hegde","Yakshagana troupes negotiate with the night",
  "All-night coastal performance is being compressed into three-hour shows for audiences that will not stay until dawn.",
  "Senior performers object to the cuts and perform them anyway, because the alternative is empty ground.",
  "A handful of troupes still stage full-length productions once a season, and those tickets sell first."]]);

D("telangana","38M","33",
 "A decade-old state with a thousand-year-old capital, running on software services, pharmaceuticals and a rain shadow.",
 [["Hyderabad",78.47,17.38],["Warangal",79.59,17.97],["Nizamabad",78.09,18.67]],"minarets",{s:0.55,y:0.18},[
 ["Business","16 Sep","6 min","Sravani Reddy","Hyderabad's pharma corridor faces its effluent bill",
  "Bulk drug manufacturing around the city has grown faster than the treatment capacity underneath it.",
  "A dedicated pharma city with common effluent infrastructure has been planned for years and acquired land in stages.",
  "Firms in the older industrial estates say relocation costs more than compliance, which is precisely the problem."],
 ["Agriculture","14 Sep","6 min","Mallesh Goud","The Kaleshwaram lift and the cost of pumped water",
  "Lifting river water several hundred metres has irrigated land that never had a canal. The electricity bill arrives every month regardless of rainfall.",
  "Operating costs are borne by the state rather than the farmer, which is why the debate is fiscal rather than agricultural.",
  "In wet years the pumps run less and the debt service does not, which is the structural issue the project has yet to resolve."],
 ["Culture","11 Sep","6 min","Anusha Rao","Bathukamma goes from courtyard to stadium and back",
  "The flower festival became a state-scale spectacle after 2014. Neighbourhood observance has quietly reasserted itself.",
  "Municipal events still draw the crowds and the cameras, and the songs that carry the ritual are sung in lanes.",
  "Folklorists recording the repertoire report more variants collected in the last five years than in the previous fifty."],
 ["Technology","08 Sep","5 min","Kiran Yadav","A data-centre cluster meets a groundwater table",
  "Hyderabad's server capacity is expanding rapidly, and the cooling water has to come from somewhere.",
  "Operators have begun specifying closed-loop and air-cooled systems, which cost more and use a fraction of the water.",
  "The state has made water disclosure a condition of new land allotments in the IT corridor."]]);

D("andhra-pradesh","54M","26",
 "Nine hundred kilometres of coast, two river deltas and a capital that has been argued about since the state was divided.",
 [["Visakhapatnam",83.30,17.69],["Vijayawada",80.65,16.51],["Tirupati",79.42,13.63]],"temple",{s:0.52,y:0.18},[
 ["Politics","16 Sep","6 min","Sarita Naidu","Three capitals, one decade, no building",
  "The question of where the state's administration sits has outlasted two governments and several court rulings.",
  "Farmers who pooled land at Amaravati are into their tenth year of waiting, holding development rights against an unbuilt plan.",
  "Whatever is decided, the land-pooling contract is the part that will be studied afterwards."],
 ["Economy","14 Sep","6 min","Ravi Teja Rao","Aquaculture's export dependency gets a stress test",
  "Shrimp ponds across the delta districts supply a market concentrated in a handful of buyers and one currency.",
  "A tariff change abroad moves farmgate prices here within a fortnight, and farmers carry the whole of that.",
  "Cooperative cold storage and a domestic market push are the hedges being attempted, so far at small scale."],
 ["Infrastructure","11 Sep","5 min","Lakshmi Prasad","Visakhapatnam's port city plan meets its own shoreline",
  "Industrial expansion north of the port has run into coastal-zone rules and a fishing harbour that predates all of it.",
  "The revised plan moves bulk handling inland and keeps the waterfront for the harbour.",
  "Trawler owners have accepted the layout and are disputing the compensation schedule."],
 ["Culture","08 Sep","6 min","Padma Sarma","Kuchipudi's home village trains outside its lineage",
  "The village that gave the dance form its name now teaches students with no family connection to it, which is recent.",
  "Residential courses run twice a year and are oversubscribed.",
  "Senior gurus describe the change as survival rather than reform, and teach the full repertoire regardless."]]);

D("tamil-nadu","77M","38",
 "The most urbanised large state, with an automobile belt, a temple economy and a water year that ends when the north-east monsoon decides.",
 [["Chennai",80.27,13.08],["Coimbatore",76.96,11.02],["Madurai",78.12,9.93]],"temple",{s:0.58,y:0.12},[
 ["Business","16 Sep","6 min","Meenakshi Sundaram","The auto belt retools for batteries, cautiously",
  "Suppliers around Chennai and Hosur are being asked to make cells and packs for customers who are also their competitors.",
  "Tier-two firms with engine-component tooling face a capital decision with a ten-year horizon and a three-year order book.",
  "The state's incentive package is generous on land and thin on skills funding, which is what the firms keep raising."],
 ["Environment","14 Sep","7 min","Kalpana Iyer","Chennai's water year is planned like a balance sheet",
  "After 2019 the city built desalination, revived tanks and metered bulk supply. The plan now assumes a failed monsoon every few years.",
  "Reservoir operating rules have been rewritten to hold water later into the year rather than spill early.",
  "Groundwater in the southern suburbs remains the weak point, and extraction there is still largely unmeasured."],
 ["Culture","11 Sep","6 min","Gowri Ramnath","The December season adds a daytime circuit",
  "Chennai's music season has grown a parallel programme of smaller venues, younger performers and afternoon slots.",
  "Sabha halls that once booked only senior artists now run two-tier calendars.",
  "Audience data collected by three organisations suggests the new slots are bringing in people who do not attend the evening concerts at all."],
 ["Economy","09 Sep","5 min","Arul Selvan","Tiruppur's knitwear cluster prices in compliance",
  "Zero liquid discharge was imposed on the cluster's dyeing units by court order and has become its marketing position.",
  "Recovered water now covers most of the cluster's dyeing demand, and salt recovery offsets part of the cost.",
  "Buyers pay a premium that does not fully cover it, which the association has stopped pretending otherwise."]]);

D("kerala","35M","14",
 "A coastal strip with the country's highest literacy, its oldest ageing curve and an economy running substantially on money sent home.",
 [["Kochi",76.27,9.93],["Thiruvananthapuram",76.95,8.52],["Kozhikode",75.78,11.26]],"coast",{s:0.72,y:0.10},[
 ["Economy","16 Sep","6 min","Ann Mary Joseph","Remittance inflows plateau and the state notices",
  "Money sent home from the Gulf has underwritten Kerala's consumption for forty years. The curve has flattened.",
  "Return migration and slower hiring abroad have changed the composition of the flow more than the total.",
  "District cooperative banks report deposit growth slowing first in the districts that sent the most workers."],
 ["Environment","14 Sep","7 min","Nikhil Menon","After the landslides, a slope-risk map with teeth",
  "Hazard zonation for the Western Ghats districts has been redrawn and, for the first time, linked to building permission.",
  "Panchayats in the highest category cannot sanction new construction without a geotechnical report.",
  "The mapping has been contested by plantation owners and upheld twice, which is why permissions are now actually being refused."],
 ["Health","11 Sep","6 min","Sheela Thomas","The ageing state builds palliative care into panchayats",
  "Kerala's community palliative network is the largest in the country and is being formally funded through local bodies.",
  "Roughly two thousand panchayats now budget for home-based care visits.",
  "Staffing is volunteer-heavy, and the programme's own review names that as the risk it has not solved."],
 ["Culture","08 Sep","6 min","Rajesh Warrier","Kathakali's night-long form gets a festival of its own",
  "Full-length performances that run until dawn are being programmed deliberately, against the trend toward excerpts.",
  "Temple committees in three districts have funded a season of complete plays.",
  "Audiences are smaller and stay longer, which the performers say changes what they can do in the second half."]]);

D("andaman-nicobar","0.4M","3",
 "Eight hundred islands, thirty-odd inhabited, closer to Southeast Asia than to the mainland and governed from it.",
 [["Port Blair",92.74,11.62],["Diglipur",92.98,13.26],["Car Nicobar",92.79,9.17]],"coast",{s:0.55,y:0.10},[
 ["Environment","16 Sep","7 min","Nandini Rao","Coral bleaching returns to the reefs off Havelock",
  "Sea-surface temperatures crossed the bleaching threshold again this year. Recovery from the last event was incomplete.",
  "Dive operators now collect standardised survey data, which has produced a longer record than any research programme here.",
  "Reef fish landings have fallen in the areas with the worst bleaching, which is the effect fishing communities report first."],
 ["Infrastructure","14 Sep","6 min","Arjun Nair","A transshipment port at Great Nicobar divides the islands",
  "A deep-water port and airport proposed for the southernmost island would put it on the main east–west shipping lane.",
  "The project area overlaps tribal reserve land and one of the country's least disturbed rainforests.",
  "Clearances have been granted with conditions, and the conditions are what the litigation is about."],
 ["Culture","11 Sep","5 min","Leela Ekka","The islands' languages are counted properly",
  "A linguistic survey has documented the Nicobarese and Great Andamanese language families in detail for the first time in decades.",
  "One language is down to a handful of speakers, all of them elderly.",
  "Recordings are being lodged with the community as well as the archive, which was the condition for making them."],
 ["Economy","09 Sep","6 min","Shibu Varghese","Inter-island shipping is the whole economy",
  "Everything that moves between the islands moves by boat on a schedule that weather rewrites weekly.",
  "Two new vessels have cut the northern run, and the southern group remains dependent on a single ship.",
  "Traders on the smaller islands price goods by expected delay rather than by distance."]]);

D("lakshadweep","0.07M","1",
 "Thirty-six coral islands with a combined land area smaller than most municipalities, and a lagoon economy that depends entirely on the reef.",
 [["Kavaratti",72.68,10.98],["Agatti",72.20,11.63],["Minicoy",72.26,8.36]],"coast",{s:0.50,y:0.10},[
 ["Environment","16 Sep","7 min","Fathima Koya","The reef is the island, and it is thinning",
  "Every island here sits on coral. Reef health is not an environmental question but a land-area one.",
  "Surveys after the last bleaching event recorded live coral cover at roughly half its 1998 level on the western reefs.",
  "Sand supply to the beaches comes from the reef, which is why shoreline loss tracks bleaching with a lag of years."],
 ["Economy","14 Sep","6 min","Abdul Rahman","Tuna pole-and-line fishing holds its certification",
  "The island fleet catches skipjack one fish at a time, which is slow, selective and now commercially valuable.",
  "Certified pole-and-line tuna reaches European buyers at a premium that supports the method.",
  "Live-bait availability in the lagoons is the constraint, and it is a reef-health question again."],
 ["Infrastructure","11 Sep","5 min","Hassan Ali","Desalination and the freshwater lens",
  "Groundwater on a coral island is a thin lens of rainwater floating on seawater. Over-extraction ruins it permanently.",
  "Low-temperature desalination plants now supply several islands, reducing draw on the lens.",
  "Power for the plants is the remaining dependency, and it currently arrives as diesel by ship."],
 ["Culture","08 Sep","6 min","Mariyam Beevi","Jazeeri drumming is taught outside the family again",
  "Island percussion traditions passed through households are now being taught in schools on three islands.",
  "The repertoire had narrowed to wedding performance within living memory.",
  "Students have begun composing in the form, which the senior players describe as the point."]]);

/* ============================================================
   PROJECTION + PATH BUILDING
   ============================================================ */
const VB = {w:880,h:960};
const NS = "http://www.w3.org/2000/svg";
const KEYS = Object.keys(STATES);
const TOTAL = KEYS.length;

const PX = lon => (lon - 67.2) * 28;
const PY = lat => (37.6 - lat) * 30;
const LON = x => x / 28 + 67.2;
const LAT = y => 37.6 - y / 30;

const rings = k => (Array.isArray(GEO[k][0]) ? GEO[k] : [GEO[k]]);

function pathOf(k){
  return rings(k).map(r=>{
    let d = "";
    for(let i=0;i<r.length;i+=2) d += (i?"L":"M") + PX(r[i]).toFixed(1) + "," + PY(r[i+1]).toFixed(1);
    return d + "Z";
  }).join(" ");
}
function bboxOf(k){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  rings(k).forEach(r=>{ for(let i=0;i<r.length;i+=2){
    const x=PX(r[i]), y=PY(r[i+1]);
    if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y;
  }});
  return {x:x0,y:y0,w:x1-x0,h:y1-y0,cx:(x0+x1)/2,cy:(y0+y1)/2};
}
function el(name,attrs,parent){
  const n = document.createElementNS(NS,name);
  for(const k in attrs) if(attrs[k]!==undefined) n.setAttribute(k,attrs[k]);
  if(parent) parent.appendChild(n);
  return n;
}
/* biggest shapes first so small states stay clickable on top */
const ORDER = KEYS.slice().sort((a,b)=>{
  const A=bboxOf(a), B=bboxOf(b);
  return (B.w*B.h) - (A.w*A.h);
});
const INDEX = {};
KEYS.forEach((k,i)=>{ INDEX[k] = String(i+1).padStart(2,"0"); });
const PAD2 = String(TOTAL).padStart(2,"0");
// Every mapped desk is selectable, but stories are considered live only after
// the API has hydrated them. Reference copy is never presented as reporting.
const isLive = () => true;
const label = k => STATES[k].plain || STATES[k].name;

/* ============================================================
   INDIA MAP
   ============================================================ */
const mapWrap = document.getElementById("mapWrap");
const svg = el("svg",{id:"india",viewBox:`0 0 ${VB.w} ${VB.h}`,preserveAspectRatio:"xMidYMid meet",role:"group","aria-label":"Interactive map of India"},mapWrap);

el("rect",{x:0,y:0,width:VB.w,height:VB.h,fill:"transparent","pointer-events":"all"},svg);

/* graticule — the map reads as an instrument, not a picture */
const grat = el("g",{class:"grat","aria-hidden":"true"},svg);
for(let lon=70;lon<=95;lon+=5){
  const x = PX(lon);
  el("line",{x1:x,y1:40,x2:x,y2:VB.h-24},grat);
  const t = el("text",{x:x+4,y:VB.h-10},grat); t.textContent = lon+"°E";
}
for(let lat=10;lat<=35;lat+=5){
  const y = PY(lat);
  el("line",{x1:20,y1:y,x2:VB.w-16,y2:y},grat);
  const t = el("text",{x:20,y:y-5},grat); t.textContent = lat+"°N";
}
/* a small compass — the map reads as a survey instrument */
const compass = el("g",{class:"compass",transform:`translate(${VB.w-46},62)`},grat);
el("line",{x1:0,y1:14,x2:0,y2:-14},compass);
el("path",{d:"M0,-14 L-3.2,-7 L0,-9.5 L3.2,-7 Z"},compass);
const nt = el("text",{x:0,y:26,"text-anchor":"middle"},compass); nt.textContent = "N";

const mapRoot = el("g",{id:"mapRoot"},svg);
const gStates = el("g",{id:"gStates"},mapRoot);
const gMarks  = el("g",{id:"gMarks"},mapRoot);
const gHits   = el("g",{id:"gHits"},mapRoot);

const vis = {}, hit = {}, marks = {};

ORDER.forEach((k,i)=>{
  const s = STATES[k], d = pathOf(k);
  vis[k] = el("path",{
    class:"st"+(isLive(k)?" live":""), d, pathLength:1,
    style:`--a:${s.a};--d:${(0.15+i*0.028).toFixed(3)}s`
  },gStates);

  const attrs = {
    class:"hit", tabindex:"0", role:"button",
    "aria-label":`${label(k)} — ${isLive(k) ? "open dispatches" : "not filed yet"}`,
    "data-k":k
  };
  if(rings(k).length > 1){
    /* island groups get the callout box as their target, not five specks */
    const bb = bboxOf(k), m = 13;
    hit[k] = el("rect",Object.assign({x:bb.x-m,y:bb.y-m,width:bb.w+m*2,height:bb.h+m*2,rx:5},attrs),gHits);
  }else{
    hit[k] = el("path",Object.assign({d},attrs),gHits);
  }
});

/* island groups get a cartographer's callout so they can be found */
const gIsle = el("g",{class:"isle","aria-hidden":"true"},mapRoot);
[["andaman-nicobar","Andaman & Nicobar"],["lakshadweep","Lakshadweep"]].forEach(pair=>{
  const bb = bboxOf(pair[0]), m = 13;
  el("rect",{x:bb.x-m,y:bb.y-m,width:bb.w+m*2,height:bb.h+m*2,rx:5},gIsle);
  const below = bb.y + bb.h < 820;
  const t = el("text",{x:bb.cx,y:below ? bb.y+bb.h+m+14 : bb.y-m-7,"text-anchor":"middle"},gIsle);
  t.textContent = pair[1].toUpperCase();
});

/* city markers, only for states we have filed */
KEYS.filter(isLive).forEach(k=>{
  const g = el("g",{class:"marks","data-k":k},gMarks);
  STATES[k].marks.forEach(m=>{
    el("circle",{cx:PX(m[1]),cy:PY(m[2]),r:1.9},g);
    const t = el("text",{x:PX(m[1])+5,y:PY(m[2])+3},g);
    t.textContent = m[0].toUpperCase();
  });
  marks[k] = g;
});

/* ============================================================
   STATE MATERIAL — one restrained textile/print pattern per
   state. Nine parametric generators cover 33 regions; scale,
   rotation and stroke vary per state so each still reads as
   its own material. Patterns are drawn twice per state — once
   in ivory for the dark map, once in ink for the paper state
   page — referenced as fills, never as images.
   ============================================================ */
const MOTIF = {
  "rajasthan":{g:"booti",   rot:12,  sc:1.15, sw:1.05},
  "gujarat":{g:"dots",      rot:0,   sc:1.0,  sw:.95},
  "punjab":{g:"chevron",    rot:0,   sc:1.05, sw:1.05},
  "haryana":{g:"weavemat",  rot:0,   sc:1.5,  sw:.9},
  "delhi":{g:"lattice",     rot:0,   sc:.85,  sw:.95},
  "uttar-pradesh":{g:"trellis", rot:-8, sc:1.2, sw:.85},
  "uttarakhand":{g:"chevron", rot:18, sc:.9,  sw:.9},
  "himachal-pradesh":{g:"chevron", rot:-16, sc:1.1, sw:1},
  "jammu-kashmir":{g:"trellis", rot:10, sc:.95, sw:.8},
  "ladakh":{g:"lattice",    rot:20,  sc:1.3,  sw:.9},
  "bihar":{g:"hatch",       rot:0,   sc:1.1,  sw:1},
  "jharkhand":{g:"hatch",   rot:22,  sc:1.35, sw:.95},
  "west-bengal":{g:"stitch",rot:0,   sc:1.15, sw:.9},
  "sikkim":{g:"chevron",    rot:32,  sc:.8,   sw:.85},
  "assam":{g:"stitch",      rot:14,  sc:1.4,  sw:.85},
  "meghalaya":{g:"weavemat",rot:20,  sc:1.1,  sw:.9},
  "arunachal-pradesh":{g:"chevron", rot:6, sc:1.3, sw:.95},
  "nagaland":{g:"chevron",  rot:-22, sc:.95,  sw:1.05},
  "manipur":{g:"diamond",   rot:15,  sc:.9,   sw:.85},
  "mizoram":{g:"stitch",    rot:-10, sc:.95,  sw:.9},
  "tripura":{g:"weavemat",  rot:-8,  sc:.9,   sw:.9},
  "odisha":{g:"diamond",    rot:0,   sc:1.2,  sw:.95},
  "chhattisgarh":{g:"hatch",rot:-14, sc:1.5,  sw:1},
  "madhya-pradesh":{g:"hatch", rot:8, sc:1.7, sw:.95},
  "maharashtra":{g:"diaper",rot:0,   sc:1.3,  sw:.9},
  "goa":{g:"trellis",       rot:24,  sc:.85,  sw:.9},
  "karnataka":{g:"diaper",  rot:20,  sc:1.05, sw:.95},
  "telangana":{g:"diamond", rot:-20, sc:.85,  sw:.9},
  "andhra-pradesh":{g:"trellis", rot:0, sc:1.35, sw:.85},
  "tamil-nadu":{g:"dots",   rot:0,   sc:.85,  sw:1},
  "kerala":{g:"trellis",    rot:-18, sc:.75,  sw:.9},
  "andaman-nicobar":{g:"weavemat", rot:0, sc:.8, sw:.9},
  "lakshadweep":{g:"weavemat", rot:24, sc:.65, sw:.85}
};

const GEN = {
  dots:(u,a,s)=>`<circle cx="${s*.28}" cy="${s*.28}" r="${s*.07}" fill="${u}"/>
    <circle cx="${s*.78}" cy="${s*.28}" r="${s*.07}" fill="${u}"/>
    <circle cx="${s*.28}" cy="${s*.78}" r="${s*.07}" fill="${u}"/>
    <circle cx="${s*.78}" cy="${s*.78}" r="${s*.09}" fill="${a}"/>
    <path d="M${s*.28},${s*.28} L${s*.78},${s*.78}" stroke="${u}" stroke-width="${s*.02}" opacity=".55"/>`,
  diamond:(u,a,s)=>`<path d="M${s*.5},${s*.06} L${s*.94},${s*.5} L${s*.5},${s*.94} L${s*.06},${s*.5} Z" fill="none" stroke="${u}" stroke-width="${s*.045}"/>
    <path d="M${s*.5},${s*.25} L${s*.75},${s*.5} L${s*.5},${s*.75} L${s*.25},${s*.5} Z" fill="${a}" opacity=".5"/>`,
  chevron:(u,a,s)=>`<path d="M0,${s*.66} L${s*.25},${s*.16} L${s*.5},${s*.66} L${s*.75},${s*.16} L${s},${s*.66}" fill="none" stroke="${u}" stroke-width="${s*.045}"/>
    <path d="M0,${s*.86} L${s*.25},${s*.36} L${s*.5},${s*.86} L${s*.75},${s*.36} L${s},${s*.86}" fill="none" stroke="${a}" stroke-width="${s*.03}" opacity=".6"/>`,
  trellis:(u,a,s)=>`<path d="M0,${s*.5} C${s*.25},0 ${s*.75},${s} ${s},${s*.5}" fill="none" stroke="${u}" stroke-width="${s*.035}"/>
    <circle cx="${s*.5}" cy="${s*.5}" r="${s*.06}" fill="${a}"/>`,
  booti:(u,a,s)=>`<path d="M${s*.5},${s*.24} L${s*.5},${s*.76} M${s*.24},${s*.5} L${s*.76},${s*.5}" stroke="${u}" stroke-width="${s*.045}"/>
    <circle cx="${s*.5}" cy="${s*.5}" r="${s*.09}" fill="${a}" opacity=".65"/>
    <circle cx="${s*.5}" cy="${s*.16}" r="${s*.055}" fill="${u}"/>`,
  stitch:(u,a,s)=>`<path d="M0,${s*.5} Q${s*.25},0 ${s*.5},${s*.5} T${s},${s*.5}" fill="none" stroke="${u}" stroke-width="${s*.05}" stroke-dasharray="${s*.09} ${s*.09}"/>
    <path d="M0,${s*.5} Q${s*.25},0 ${s*.5},${s*.5} T${s},${s*.5}" fill="none" stroke="${a}" stroke-width="${s*.03}" stroke-dasharray="${s*.09} ${s*.09}" stroke-dashoffset="${s*.09}" opacity=".55"/>`,
  hatch:(u,a,s)=>`<path d="M${s*.16},${s*.8} L${s*.16},${s*.32} L${s*.44},${s*.8} Z" fill="none" stroke="${u}" stroke-width="${s*.04}"/>
    <path d="M${s*.16},${s*.16} L${s*.8},${s*.16}" stroke="${u}" stroke-width="${s*.04}"/>
    <circle cx="${s*.68}" cy="${s*.6}" r="${s*.07}" fill="${a}" opacity=".6"/>`,
  diaper:(u,a,s)=>`<path d="M0,${s*.5} L${s*.5},0 L${s},${s*.5} L${s*.5},${s} Z" fill="none" stroke="${u}" stroke-width="${s*.04}"/>
    <circle cx="${s*.5}" cy="${s*.5}" r="${s*.09}" fill="${a}" opacity=".6"/>`,
  lattice:(u,a,s)=>`<rect x="${s*.16}" y="${s*.16}" width="${s*.68}" height="${s*.68}" fill="none" stroke="${u}" stroke-width="${s*.04}" transform="rotate(45 ${s*.5} ${s*.5})"/>
    <circle cx="${s*.5}" cy="${s*.5}" r="${s*.06}" fill="${a}" opacity=".65"/>`,
  weavemat:(u,a,s)=>`<path d="M0,0 L${s},${s} M${s},0 L0,${s}" stroke="${u}" stroke-width="${s*.05}"/>
    <path d="M0,${s*.5} L${s},${s*.5} M${s*.5},0 L${s*.5},${s}" stroke="${a}" stroke-width="${s*.03}" opacity=".45"/>`
};

function buildPattern(defs,key,tone){
  const m = MOTIF[key] || {g:"lattice",rot:0,sc:1,sw:1};
  const u = tone === "paper" ? "rgba(23,19,16,.5)" : "rgba(23,19,16,.52)";
  const size = 15 * m.sc;
  const pat = el("pattern",{
    id:`pat-${key}${tone==="paper"?"-paper":""}`,
    width:size,height:size,patternUnits:"userSpaceOnUse",
    patternTransform:`rotate(${m.rot})`
  },defs);
  pat.innerHTML = GEN[m.g](u, STATES[key].a, size);
}

const gPatFill = el("g",{id:"gPatFill","aria-hidden":"true"},mapRoot);
const patfill = {};
{
  const defs = el("defs",{},svg);
  ORDER.forEach(k=>{
    buildPattern(defs,k,"map");
    buildPattern(defs,k,"paper");
    patfill[k] = el("path",{
      class:"patfill", d:pathOf(k), fill:`url(#pat-${k})`
    },gPatFill);
  });
}

/* ============================================================
   STATE INTERACTION
   ============================================================ */
const readout = document.getElementById("readout");
const roName = document.getElementById("roName");
const roEp   = document.getElementById("roEp");
const roMeta = document.getElementById("roMeta");
const coord  = document.getElementById("coord");
const hint   = document.getElementById("hint");
const stage  = document.getElementById("stage");
const TOUCH = window.matchMedia("(hover:none)").matches;
if(TOUCH){
  hint.textContent = "Tap a state to open its dispatches";
  document.querySelector(".flank-l .sub").textContent =
    "Every state and territory keeps a desk. Tap a shape and read what it sent.";
}
const HINT_DEFAULT = hint.textContent;

let hovered = null, busy = false, current = null;
const stateStoryCache = new Map();
const STATE_CACHE_PREFIX = "sutradhar-state-snapshot:v3:";

function readStateSnapshot(key){
  try {
    const raw = localStorage.getItem(STATE_CACHE_PREFIX + key);
    if(!raw) return null;
    const snapshot = JSON.parse(raw);
    return Array.isArray(snapshot.stories) ? snapshot : null;
  } catch(error) {
    return null;
  }
}

function writeStateSnapshot(key, stories, facts){
  try {
    localStorage.setItem(STATE_CACHE_PREFIX + key, JSON.stringify({stories, facts, savedAt: Date.now()}));
  } catch(error) {
    // A full/private browser storage area should not block live news loading.
  }
}

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}

function formatRetrievedTime(value){
  if(!value) return "TIME UNAVAILABLE";
  const date = new Date(value);
  if(Number.isNaN(date.getTime())) return "TIME UNAVAILABLE";
  return date.toLocaleString("en-IN", {day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit", hour12:false, timeZone:"Asia/Kolkata"}).replace(",", " ·") + " IST";
}

function backendStory(summary){
  const sourceNames = (summary.sources || []).join(" · ");
  return {
    cat: "Coverage",
    date: formatRetrievedTime(summary.latest_published_at),
    read: "Compare",
    by: sourceNames || "Sutradhar desk",
    h: summary.story_title || "Untitled story",
    dek: "Grouped coverage from the Sutradhar story graph.",
    body: ["This story is backed by the live Sutradhar story API.", sourceNames ? "Sources: " + sourceNames + "." : "Open the original publisher links to inspect the coverage."],
    articleCount: Math.max(Number(summary.article_count || 0), Array.isArray(summary.article_ids) ? summary.article_ids.length : 0),
    articleIds: Array.isArray(summary.article_ids) ? summary.article_ids : [],
    publishedAt: summary.latest_published_at || "",
    kind: "grouped",
    api: { runId: summary.run_id, storyId: summary.story_id }
  };
}

function backendArticle(article){
  const source = article.source?.name || article.source_id || "Sutradhar desk";
  return {
    cat: "Latest feed",
    date: formatRetrievedTime(article.published_at),
    read: "Read original",
    by: source,
    h: article.headline || "Untitled article",
    dek: article.summary || "Latest article from the state feed.",
    body: [article.summary || "Latest article from the state feed.", article.url || ""],
    articleCount: 1,
    articleId: article.article_id,
    publishedAt: article.published_at || "",
    kind: "latest"
  };
}

function backendStateName(key){
  return String(STATES[key].plain || STATES[key].name).replaceAll("&amp;","&");
}

function storyOrder(a,b){
  const aGrouped = a.kind === "grouped";
  const bGrouped = b.kind === "grouped";
  if(aGrouped !== bGrouped) return aGrouped ? -1 : 1;
  if(aGrouped){
    const countDifference = (b.articleCount || 0) - (a.articleCount || 0);
    if(countDifference) return countDifference;
  }
  return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
}

async function hydrateState(key, force = false){
  const cachedStories = stateStoryCache.get(key);
  if(!force && Array.isArray(cachedStories) && cachedStories.length > 0){
    STATES[key].allStories = cachedStories;
    STATES[key].stories = cachedStories;
    updateFeaturedCount(key);
    if(current === key) refreshStateContent(key);
    return;
  }
  if(!force){
    const snapshot = readStateSnapshot(key);
    if(snapshot){
      stateStoryCache.set(key, snapshot.stories);
      STATES[key].allStories = snapshot.stories;
      STATES[key].stories = snapshot.stories;
      STATES[key].facts = snapshot.facts || STATES[key].facts;
      updateFeaturedCount(key);
      if(current === key) refreshStateContent(key);
      return;
    }
  }
  try {
    const stateName = backendStateName(key);
    const payload = await getStateStories(stateName);
    let stories = Array.isArray(payload.stories) ? payload.stories.map(backendStory) : [];
    if(stories.length === 0){
      const latest = await getStateArticles(stateName);
      stories = Array.isArray(latest.articles) ? latest.articles.map(backendArticle) : [];
    }else{
      const latest = await getStateArticles(stateName);
      const groupedArticleIds = new Set(stories.flatMap(story=>story.articleIds || []));
      const fallback = Array.isArray(latest.articles)
        ? latest.articles
          .map(backendArticle)
          .filter(article=>!groupedArticleIds.has(article.articleId))
        : [];
      stories = stories.concat(fallback);
    }
    stories.sort(storyOrder);
    if(stories.length > 0) stateStoryCache.set(key, stories);
    else stateStoryCache.delete(key);
    STATES[key].allStories = stories;
    STATES[key].stories = stories;
    const groupedArticleCount = stories
      .filter(story=>story.kind === "grouped")
      .reduce((total, story)=>total + Math.max(0, Number(story.articleCount || 0)), 0);
    const latestCount = stories.filter(story=>story.kind === "latest").length;
    STATES[key].facts = [["Total articles", String(groupedArticleCount + latestCount)], ["Grouped articles", String(groupedArticleCount)], ["Latest reports", String(latestCount)], ["Capital", STATES[key].cap]];
    writeStateSnapshot(key, stories, STATES[key].facts);
    updateFeaturedCount(key);
    if(current === key) refreshStateContent(key);
  } catch (error) {
    console.warn("Sutradhar state API unavailable.", error);
    stateStoryCache.delete(key);
    STATES[key].allStories = [];
    STATES[key].stories = [];
    STATES[key].facts = [["Total articles", "Unavailable"], ["Grouped articles", "Unavailable"], ["Latest reports", "Unavailable"], ["Capital", STATES[key].cap]];
    updateFeaturedCount(key);
    if(current === key) refreshStateContent(key);
  }
}

function refreshStateContent(key){
  if(current !== key) return;
  spFacts.innerHTML = STATES[key].facts.map(f=>`<div class="fact"><dt>${f[0]}</dt><dd>${f[1]}</dd></div>`).join("");
  renderStories(key);
}

async function hydrateAllStates(force = false, exclude = []){
  const excluded = new Set(exclude);
  const pendingKeys = KEYS.filter(key=>!excluded.has(key));
  const batchSize = 6;
  for(let i=0;i<pendingKeys.length;i+=batchSize){
    await Promise.all(pendingKeys.slice(i,i+batchSize).map(key=>hydrateState(key, force)));
  }
}

function formatMarketValue(item){
  if(item.value == null) return "—";
  if(item.key === "usd_inr") return "₹" + Number(item.value).toFixed(2);
  if(item.key === "nifty50" || item.key === "sensex") return Number(item.value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return "₹" + Number(item.value).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

async function hydrateMarket(){
  try {
    const payload = await getMarket();
    const byLabel = new Map((payload.instruments || []).map(item => [String(item.label || "").toUpperCase(), item]));
    document.querySelectorAll(".ticker-item").forEach(item => {
      const labelNode = item.querySelector("b");
      const priceNode = item.querySelector(".ticker-price");
      if(!labelNode || !priceNode) return;
      const quote = byLabel.get(labelNode.textContent.trim().toUpperCase());
      if(!quote) return;
      priceNode.textContent = formatMarketValue(quote);
      const change = item.querySelector(".ticker-change");
      if(change && quote.change_percent != null){
        change.textContent = (quote.change_percent >= 0 ? "▲ " : "▼ ") + Math.abs(quote.change_percent).toFixed(2) + "%";
        change.classList.toggle("up", quote.change_percent >= 0);
        change.classList.toggle("down", quote.change_percent < 0);
      }
    });
  } catch(error) {
    console.warn("Sutradhar market API unavailable; keeping reference ticker values.", error);
  }
}

function setHot(k,on){
  if(!k || !vis[k]) return;
  vis[k].classList.toggle("hot",on);
  hit[k].classList.toggle("hot",on);
  if(patfill[k]) patfill[k].classList.toggle("hot",on);
  if(marks[k]) marks[k].classList.toggle("on",on);
}
function showReadout(k){
  const s = STATES[k];
  readout.style.setProperty("--a",s.a);
  roEp.textContent = s.ep;
  roName.innerHTML = s.name;
  roMeta.textContent = `${s.cap}  ·  ` +
    (isLive(k) ? `${s.stories.length} dispatches` : "not filed yet");
  readout.classList.add("on");
}
function showNationalReadout(){
  readout.style.setProperty("--a", "#D92243");
  roEp.textContent = "National desk";
  roName.textContent = "Get National News";
  roMeta.textContent = "Click to open nationwide dispatches";
  readout.classList.add("on");
}
function placeReadout(e){
  if(window.matchMedia("(max-width:760px)").matches) return;
  const r = readout.getBoundingClientRect();
  let x = e.clientX + 22, y = e.clientY - r.height / 2;
  if(x + r.width > innerWidth - 12) x = e.clientX - r.width - 22;
  y = Math.max(12, Math.min(innerHeight - r.height - 12, y));
  readout.style.left = x + "px";
  readout.style.top  = y + "px";
}
function onEnter(k){
  if(busy || hovered === k) return;
  if(hovered) setHot(hovered,false);
  hovered = k;
  setHot(k,true);
  mapRoot.setAttribute("data-hover","1");
  showReadout(k);
  hint.textContent = isLive(k)
    ? (TOUCH ? "Tap again to open " : "Click to open ") + label(k)
    : label(k) + " — no dispatches filed yet";
}
function onLeave(){
  if(busy) return;
  if(hovered) setHot(hovered,false);
  hovered = null;
  mapRoot.removeAttribute("data-hover");
  readout.classList.remove("on");
  hint.textContent = HINT_DEFAULT;
}

KEYS.forEach(k=>{
  const h = hit[k];
  h.addEventListener("pointerenter",e=>{onEnter(k);placeReadout(e);});
  h.addEventListener("pointerleave",onLeave);
  h.addEventListener("focus",()=>onEnter(k));
  h.addEventListener("blur",onLeave);
  h.addEventListener("click",()=>select(k));
  h.addEventListener("keydown",e=>{
    if(e.key === "Enter" || e.key === " "){ e.preventDefault(); select(k); }
  });
});
const FEATURED = ["uttar-pradesh","maharashtra","west-bengal","tamil-nadu"];
const featured = document.getElementById("featured");
const featuredButtons = new Map();
function updateFeaturedCount(key){
  const count = featuredButtons.get(key)?.querySelector(".featured-count");
  if(!count) return;
  const stories = Array.isArray(STATES[key].allStories) ? STATES[key].allStories : STATES[key].stories;
  if(!Array.isArray(stories) || stories.length === 0){
    count.textContent = "—";
    return;
  }
  const total = stories
    .filter(story=>story.kind === "grouped")
    .reduce((sum, story)=>sum + Math.max(0, Number(story.articleCount || 0)), 0)
    + stories.filter(story=>story.kind === "latest").length;
  count.textContent = `${total} ${total === 1 ? "article" : "articles"}`;
}
FEATURED.forEach(k=>{
  const b = document.createElement("button");
  b.type = "button"; b.className = "idx-item"; b.dataset.go = k;
  b.innerHTML = `${STATES[k].name} <span class="featured-count">—</span>`;
  featuredButtons.set(k,b);
  featured.appendChild(b);
});
document.getElementById("tally").textContent =
  TOTAL + " states and territories · " +
  KEYS.reduce((n,k)=>n + (STATES[k].stories ? STATES[k].stories.length : 0),0) + " dispatches filed";

document.querySelectorAll(".idx-item").forEach(btn=>{
  const k = btn.dataset.go;
  btn.addEventListener("pointerenter",()=>onEnter(k));
  btn.addEventListener("pointerleave",onLeave);
  btn.addEventListener("focus",()=>onEnter(k));
  btn.addEventListener("blur",onLeave);
  btn.addEventListener("click",()=>select(k));
});

svg.addEventListener("pointermove",e=>{
  placeReadout(e);
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const m = svg.getScreenCTM();
  if(!m) return;
  const p = pt.matrixTransform(m.inverse());
  coord.textContent = LAT(p.y).toFixed(1) + "°N  " + LON(p.x).toFixed(1) + "°E";
});
svg.addEventListener("pointerleave",()=>{ coord.textContent = "—"; });

/* ============================================================
   ANIMATIONS — camera + curtain
   ============================================================ */
const easeQuint = p => p < .5 ? 16*p*p*p*p*p : 1 - Math.pow(-2*p+2,5)/2;
let camRAF = 0, cam = {k:1,cx:VB.w/2,cy:VB.h/2};
const REDUCED = window.matchMedia("(prefers-reduced-motion:reduce)").matches;

function applyCam(k,cx,cy){
  const tx = VB.w/2 - k*cx, ty = VB.h/2 - k*cy;
  mapRoot.setAttribute("transform",`translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${k.toFixed(4)})`);
}
function camTo(k,cx,cy,dur){
  cancelAnimationFrame(camRAF);
  if(REDUCED){ cam = {k,cx,cy}; applyCam(k,cx,cy); return; }
  const from = {...cam}, t0 = performance.now();
  (function frame(now){
    const p = Math.min(1,(now-t0)/dur), e = easeQuint(p);
    const nk = from.k+(k-from.k)*e, ncx = from.cx+(cx-from.cx)*e, ncy = from.cy+(cy-from.cy)*e;
    applyCam(nk,ncx,ncy);
    cam = {k:nk,cx:ncx,cy:ncy};
    if(p < 1) camRAF = requestAnimationFrame(frame);
  })(performance.now());
}
function zoomState(k,dur){
  const bb = bboxOf(k);
  const fit = Math.min(VB.w/(bb.w*1.85), VB.h/(bb.h*1.85));
  camTo(Math.max(1.45,Math.min(3.6,fit)), bb.cx, bb.cy, dur);
}
function zoomOut(dur){ camTo(1,VB.w/2,VB.h/2,dur); }

const curtain = document.getElementById("curtain");
function curtainUp(){ curtain.classList.remove("down"); void curtain.offsetWidth; curtain.classList.add("up"); }
function curtainDown(){ curtain.classList.remove("up"); void curtain.offsetWidth; curtain.classList.add("down"); }
const wait = ms => new Promise(r=>setTimeout(r,REDUCED?Math.min(ms,40):ms));

/* ============================================================
   STATE PAGE
   ============================================================ */
const statePage = document.getElementById("statePage");
const spScroll  = document.getElementById("spScroll");
const spName    = document.getElementById("spName");
const spEp      = document.getElementById("spEp");
const spStand   = document.getElementById("spStand");
const spIndex   = document.getElementById("spIndex");
const spFacts   = document.getElementById("spFacts");
const spArt     = document.getElementById("spArt");
const spStories = document.getElementById("spStories");
const spCount   = document.getElementById("spCount");
const bcState   = document.getElementById("bcState");
const mini      = document.getElementById("mini");

/* --- original artwork, drawn in a 100 × 100 box and then
       cropped by the state's own outline ------------------- */
function monument(key,g){
  const add=(n,a,cls)=>{const e=el(n,a,g); if(cls) e.setAttribute("class",cls); return e;};
  const ln =(d,w,o)=>el("path",{d,fill:"none",stroke:"rgba(20,15,12,"+(o||0.45)+")",
                 "stroke-width":w||1.4,"stroke-linecap":"round"},g);
  const box=(x,y,w,h,c)=>add("rect",{x,y,width:w,height:h},c);
  const dome=(x,w,y,h,c)=>add("path",{d:`M${x},${y} C${x},${y-h} ${x+w},${y-h} ${x+w},${y} Z`},c);
  const water=(a,b,c2)=>{ln(`M0,${a} H100`,1.4,.35); ln(`M6,${b} H100`,1.4,.28); ln(`M0,${c2} H88`,1.4,.2);};

  switch(STATES[key].motif){

  case "taj":                                     /* Taj Mahal — Uttar Pradesh */
    box(6,80,88,5,"mon-2");
    [13,25,71,83].forEach(x=>{ box(x,40,3.4,28,"mon-2"); add("circle",{cx:x+1.7,cy:39,r:2.2},"mon-2"); });
    dome(31,8,47,8,"mon-2"); dome(61,8,47,8,"mon-2");
    box(14,68,72,12,"mon"); box(28,47,44,21,"mon"); box(41,44,18,4,"mon");
    add("path",{d:"M37,46 C31,37 33,26 50,11 C67,26 69,37 63,46 Z"},"mon");
    ln("M50,11 L50,4",1.6,.9); add("circle",{cx:50,cy:3,r:1.5},"mon");
    add("path",{d:"M43,68 L43,57 A7,7 0 0 1 57,57 L57,68 Z"},"mon-2");
    water(88,93,98); break;

  case "gateway":                                 /* Gateway of India — Maharashtra */
    [[2,52],[9,44],[16,58],[85,48],[92,40]].forEach(b=>box(b[0],b[1],6.5,78-b[1],"mon-2"));
    box(6,78,88,6,"mon-2");
    box(17,40,9,38,"mon"); box(74,40,9,38,"mon"); dome(17,9,40,9,"mon"); dome(74,9,40,9,"mon");
    box(26,36,48,42,"mon"); box(22,30,56,7,"mon");
    add("path",{d:"M37,78 L37,52 A13,13 0 0 1 63,52 L63,78 Z"},"mon-2");
    dome(31,8,30,7,"mon"); dome(61,8,30,7,"mon");
    ln("M50,30 L50,19",1.6,.9); add("circle",{cx:50,cy:18,r:1.6},"mon");
    water(88,93,98); break;

  case "peaks":                                   /* Himalaya and the eastern hills */
    add("path",{d:"M0,80 L14,48 L26,64 L40,34 L54,60 L68,42 L82,64 L100,40 L100,80 Z"},"mon-2");
    add("path",{d:"M0,80 L20,56 L34,70 L50,28 L64,58 L78,46 L94,72 L100,68 L100,80 Z"},"mon");
    ln("M50,28 L50,14",1.6,.9);
    ln("M50,16 C60,17 66,21 76,21",1.2,.5); ln("M50,21 C58,22 64,25 72,25",1.2,.4);
    box(0,80,100,5,"mon-2");
    ln("M0,88 H100",1.4,.25); break;

  case "fort":                                    /* hill fort — Rajasthan, Deccan, plateau */
    add("path",{d:"M0,86 C18,80 24,62 50,60 C76,62 82,80 100,86 Z"},"mon-2");
    box(18,36,10,28,"mon"); box(72,36,10,28,"mon");
    dome(18,10,36,7,"mon"); dome(72,10,36,7,"mon");
    box(24,46,52,18,"mon");
    [25,33,41,49,57,65].forEach(x=>box(x,42,5,4,"mon"));
    add("path",{d:"M44,64 L44,53 A6,6 0 0 1 56,53 L56,64 Z"},"mon-2");
    ln("M20,30 L20,22",1.4,.8); ln("M74,30 L74,22",1.4,.8);
    box(0,86,100,4,"mon-2"); break;

  case "temple":                                  /* gopuram — Odisha, Andhra, Tamil Nadu */
    box(6,80,88,5,"mon-2");
    box(8,60,12,20,"mon-2"); box(80,60,12,20,"mon-2");
    box(20,70,60,10,"mon");
    add("path",{d:"M32,70 L38,28 L62,28 L68,70 Z"},"mon");
    [[34,58,32],[36,48,28],[38,38,24]].forEach(t=>box(t[0],t[1],t[2],3,"mon-2"));
    dome(36,28,28,8,"mon");
    [42,50,58].forEach((x,i)=>add("circle",{cx:x,cy:i===1?17:19,r:1.6},"mon"));
    add("path",{d:"M44,70 L44,56 A6,6 0 0 1 56,56 L56,70 Z"},"mon-2");
    ln("M0,88 H100",1.4,.25); break;

  case "minarets":                                /* Charminar — Telangana */
    box(8,80,84,5,"mon-2");
    box(26,32,5,48,"mon-2"); box(69,32,5,48,"mon-2");
    dome(26,5,32,5,"mon-2"); dome(69,5,32,5,"mon-2");
    box(22,46,56,34,"mon");
    add("path",{d:"M38,80 L38,58 A12,12 0 0 1 62,58 L62,80 Z"},"mon-2");
    box(13,24,8,56,"mon"); box(79,24,8,56,"mon");
    dome(13,8,24,8,"mon"); dome(79,8,24,8,"mon");
    [40,56].forEach(y=>{box(12,y,10,2.5,"mon-2"); box(78,y,10,2.5,"mon-2");});
    dome(42,16,46,9,"mon");
    ln("M0,88 H100",1.4,.25); break;

  case "arch":                                    /* ceremonial arch — Delhi */
    box(10,80,80,5,"mon-2");
    box(16,72,12,8,"mon-2"); box(72,72,12,8,"mon-2");
    box(28,30,44,50,"mon"); box(24,23,52,8,"mon");
    add("path",{d:"M40,80 L40,50 A10,10 0 0 1 60,50 L60,80 Z"},"mon-2");
    dome(44,12,23,8,"mon");
    ln("M50,15 L50,8",1.4,.8);
    [34,66].forEach(x=>box(x,36,3,40,"mon-2"));
    ln("M0,88 H100",1.4,.25); break;

  case "coast":                                   /* palms and a lagoon boat */
    ln("M17,80 C14,62 14,50 19,36",3.2,.85);
    ["M19,36 C9,28 3,32 0,39 C7,36 13,38 19,42",
     "M19,36 C29,26 37,29 41,36 C34,34 26,36 19,42",
     "M19,36 C14,24 18,17 26,14 C22,21 21,28 21,36",
     "M19,36 C24,25 33,22 40,24 C32,27 24,31 20,38"].forEach(d=>ln(d,2.2,.8));
    ln("M86,80 C84,68 84,60 87,50",2.4,.6);
    ["M87,50 C80,44 76,47 74,52 C79,50 83,51 87,54",
     "M87,50 C94,43 99,46 100,51 C95,49 91,50 87,54"].forEach(d=>ln(d,1.8,.55));
    add("path",{d:"M30,74 L70,74 L64,82 L36,82 Z"},"mon");
    ln("M52,74 L52,48",2,.9);
    add("path",{d:"M52,50 L52,72 L74,72 Z"},"mon-2");
    water(88,93,98); break;

  case "river":                                   /* a country boat on a wide river */
    box(0,58,100,5,"mon-2");
    [[8,50],[20,52],[34,48],[62,51],[78,47],[90,52]].forEach(t=>
      add("path",{d:`M${t[0]},58 L${t[0]+5},${t[1]} L${t[0]+10},58 Z`},"mon-2"));
    add("path",{d:"M14,74 C26,86 74,86 86,74 Z"},"mon");
    box(38,60,24,14,"mon"); add("path",{d:"M36,60 L64,60 L60,54 L40,54 Z"},"mon");
    ln("M74,74 L78,50",2,.85);
    add("circle",{cx:28,cy:70,r:2.4},"mon");
    water(88,93,98); break;

  case "port":                                    /* container quay — Gujarat */
    box(0,78,100,6,"mon-2");
    [[14,40],[58,48]].forEach(c=>{
      const x=c[0], top=c[1];
      ln(`M${x+4},78 L${x+8},${top}`,3,.85); ln(`M${x+26},78 L${x+22},${top}`,3,.85);
      box(x-4,top-5,46,5,"mon"); box(x+12,top-20,5,16,"mon");
      ln(`M${x+42},${top} L${x+42},${top+14}`,2,.6);
    });
    [[4,66],[20,66],[4,56],[36,66]].forEach(b=>box(b[0],b[1],14,9,"mon-2"));
    add("path",{d:"M58,70 L98,70 L94,78 L62,78 Z"},"mon");
    water(86,92,98); break;
  }
}

function buildArt(key){
  spArt.innerHTML = "";
  const st = STATES[key], bb = bboxOf(key), d = pathOf(key);
  const A = st.art || {s:0.70,y:0.26};
  const islands = rings(key).length > 1;          /* Andaman & Nicobar, Lakshadweep */
  const pad = islands ? Math.max(bb.w,bb.h)*0.18 : Math.max(bb.w,bb.h)*0.1;
  const span = bb.w + pad*2;
  const vw = islands ? span * 1.9 : span;
  const s = el("svg",{
    viewBox:`${bb.x - pad - (islands ? span*0.9 : 0)} ${bb.y-pad} ${vw} ${bb.h+pad*2}`,
    preserveAspectRatio:"xMidYMid meet","aria-hidden":"true"
  },spArt);
  const defs = el("defs",{},s);
  const lg = el("linearGradient",{id:"grad-"+key,x1:"0",y1:"0",x2:"0.25",y2:"1"},defs);
  el("stop",{offset:"0","stop-color":st.a,"stop-opacity":"1"},lg);
  el("stop",{offset:"1","stop-color":st.a,"stop-opacity":".68"},lg);

  if(islands){
    /* the motif sits beside the chain rather than inside specks of coral */
    const side = bb.h * 0.50;
    const inner = el("g",{transform:
      `translate(${(bb.x - pad - span*0.9 + vw*0.30 - side/2).toFixed(1)},${(bb.cy + bb.h*0.10 - side*0.86).toFixed(1)}) scale(${(side/100).toFixed(4)})`},s);
    monument(key,inner);
    const m2 = Math.max(bb.w,bb.h)*0.09;
    el("rect",{x:bb.x-m2,y:bb.y-m2,width:bb.w+m2*2,height:bb.h+m2*2,rx:m2*0.4,
      fill:"none",stroke:"rgba(23,19,16,.28)","stroke-width":1.2,"stroke-dasharray":"5 6"},s);
    el("path",{class:"sil-fill",d,fill:`url(#grad-${key})`},s);
    el("path",{d,fill:`url(#pat-${key}-paper)`,opacity:.5},s);
    el("path",{class:"sil-line",d,"stroke-width":2},s);
  }else{
    const cp = el("clipPath",{id:"clip-"+key},defs);
    el("path",{d},cp);
    el("path",{class:"sil-fill",d,fill:`url(#grad-${key})`},s);
    el("path",{d,fill:`url(#pat-${key}-paper)`,opacity:.5},s);
    const g = el("g",{"clip-path":`url(#clip-${key})`},s);
    const side = Math.sqrt(bb.w * bb.h) * A.s;
    const baseY = bb.cy + bb.h * A.y;
    const inner = el("g",{transform:
      `translate(${(bb.cx - side/2).toFixed(1)},${(baseY - side*0.86).toFixed(1)}) scale(${(side/100).toFixed(4)})`},g);
    monument(key,inner);
    el("path",{class:"sil-line",d},s);
  }

  const n = document.createElement("div");
  n.className = "art-num";
  n.textContent = INDEX[key];
  spArt.appendChild(n);
}

function buildMini(key){
  mini.innerHTML = "";
  const s = el("svg",{viewBox:`0 0 ${VB.w} ${VB.h}`,preserveAspectRatio:"xMidYMid meet","aria-hidden":"true"},mini);
  ORDER.forEach(k=>{
    el("path",{class:"st"+(k===key?" self":""),d:pathOf(k)},s);
  });
}

function articleSummaryMarkup(summary){
  const text = String(summary || "").trim();
  if(!text) return "";
  if(text.length < 420 && text.split(/\s+/).length < 70){
    return `<p class="b">${escapeHtml(text)}</p>`;
  }
  return `<details class="article-summary"><summary><span>Summary</span><b>Read more</b></summary><p class="b">${escapeHtml(text)}</p></details>`;
}

function articleLinkMarkup(url){
  return url ? `<p class="article-source-link"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Read original article ↗</a></p>` : "";
}

function groupedArticleMarkup(article){
  return `<article class="grouped-article">` +
    `<p class="grouped-source">${escapeHtml(article.source?.name || "Publisher")}</p>` +
    `<h3>${escapeHtml(article.headline || "Untitled article")}</h3>` +
    articleSummaryMarkup(article.summary) + articleLinkMarkup(article.url) +
    `</article>`;
}

function feedSummaryMarkup(text){
  const value = String(text || "");
  if(value.split(/\s+/).length < 42 && value.length < 260) return `<span class="dek">${escapeHtml(value)}</span>`;
  return `<span class="feed-summary"><span class="feed-summary-text">${escapeHtml(value)}</span><span class="feed-summary-toggle" role="button" tabindex="0">Read more</span></span>`;
}

function bindFeedSummary(card){
  const summary = card.querySelector(".feed-summary");
  if(!summary) return;
  const toggle = summary.querySelector(".feed-summary-toggle");
  const expand = (event)=>{
    event.stopPropagation();
    summary.classList.toggle("expanded");
    toggle.textContent = summary.classList.contains("expanded") ? "Read less" : "Read more";
  };
  toggle.addEventListener("click",expand);
  toggle.addEventListener("keydown",event=>{ if(event.key === "Enter" || event.key === " "){ event.preventDefault(); expand(event); } });
}

function renderStories(key, limit = 12){
  const s = STATES[key];
  const allStories = Array.isArray(s.allStories) ? s.allStories : s.stories;
  s.stories = allStories.slice(0, Math.min(limit, allStories.length));
  spStories.innerHTML = "";
  const groupedCount = s.stories.filter(story=>story.kind !== "latest").length;
  const latestCount = s.stories.filter(story=>story.kind === "latest").length;
  const totalGroupedCount = allStories.filter(story=>story.kind !== "latest").length;
  const totalLatestCount = allStories.filter(story=>story.kind === "latest").length;
  spCount.textContent = `Showing ${s.stories.length} of ${allStories.length} dispatches · ${groupedCount}/${totalGroupedCount} grouped stories · ${latestCount}/${totalLatestCount} latest reports · edition 01`;
  s.stories.slice(0, limit).forEach((st,i)=>{
    const b = document.createElement("button");
    b.type = "button";
    b.className = "story" + (i === 0 ? " lead" : "");
    const meta = `${feedSummaryMarkup(st.dek)}<span class="by">${st.by} · ${st.read} read</span>`;
    b.innerHTML =
      `<span class="idx">${String(i+1).padStart(2,"0")}</span>` +
      `<span class="col-a"><span class="cat">${st.cat}<s>${st.date}</s></span>` +
      `<h4>${st.h}</h4>${i === 0 ? meta : ""}</span>` +
      (i === 0 ? "" : `<span class="col-b">${meta}</span>`);
    b.addEventListener("click",()=>openReader(key,i));
    bindFeedSummary(b);
    spStories.appendChild(b);
  });
  if(allStories.length > limit){
    const more = document.createElement("button");
    more.type = "button";
    more.className = "story-more";
    more.textContent = `Read more articles · show next ${allStories.length - limit}`;
    more.addEventListener("click",()=>renderStories(key, allStories.length));
    spStories.appendChild(more);
  }
}

function renderState(key){
  const s = STATES[key];
  current = key;
  statePage.style.setProperty("--c",s.a);
  document.documentElement.style.setProperty("--c",s.a);
  spName.innerHTML = s.name;
  spEp.textContent = s.ep;
  spStand.textContent = s.stand;
  spIndex.textContent = `State ${INDEX[key]} of ${PAD2}`;
  bcState.innerHTML = s.name;
  spFacts.innerHTML = s.facts.map(f=>`<div class="fact"><dt>${f[0]}</dt><dd>${f[1]}</dd></div>`).join("");
  buildArt(key);
  buildMini(key);
  renderStories(key);
  spScroll.scrollTop = 0;
  const nk = KEYS[(KEYS.indexOf(key) + 1) % KEYS.length];
  nextState.innerHTML = `Next: ${STATES[nk].name} <i>→</i>`;
  nextState.dataset.k = nk;
  statePage.setAttribute("aria-hidden","false");
  /* restart the reveal choreography */
  statePage.removeAttribute("data-open");
  void statePage.offsetWidth;
  statePage.setAttribute("data-open","1");
}

/* ============================================================
   NATIONAL DESK — uses the same state-page choreography,
   but replaces the state silhouette with the full India map.
   ============================================================ */
const NATIONAL = {
  name:"National News",
  ep:"National desk · Edition 01",
  stand:"The country in one frame — a national dispatch assembled from the desks across SUTRADHAR.",
  facts:[
    ["Desks","33"],
    ["Coverage","Nationwide"],
    ["Filed","Today"]
  ],
  stories:[
    {cat:"Economy",date:"18 SEP",h:"Reserve Bank holds rates, signals a longer pause",dek:"Markets watch the central bank's next signals as policymakers balance inflation and growth.",by:"National Desk",read:"4 min",body:["The latest national economic signals are being watched closely by businesses, households and markets.","Policymakers continue to balance price stability with the pace of growth as the next set of decisions approaches."]},
    {cat:"Climate",date:"18 SEP",h:"Early monsoon retreat leaves reservoirs uneven",dek:"Water levels remain varied across regions as the season moves into its final stretch.",by:"National Desk",read:"3 min",body:["The end of the monsoon season is leaving a mixed picture across the country's reservoirs and river systems.","Regional differences remain pronounced, with local water managers preparing for the months ahead."]},
    {cat:"Policy",date:"18 SEP",h:"New data rules take effect nationwide",dek:"Organisations begin adjusting their systems and reporting practices to the new framework.",by:"National Desk",read:"5 min",body:["Organisations across sectors are beginning to adapt internal systems and reporting practices to the new national framework.","The transition is expected to vary by industry as teams interpret the requirements and update their workflows."]},
    {cat:"Cities",date:"18 SEP",h:"A changing country is being measured one city at a time",dek:"Urban desks are tracking how infrastructure, work and migration are reshaping everyday life.",by:"National Desk",read:"4 min",body:["From metros to smaller cities, local reporting continues to reveal how national shifts are experienced on the ground.","The patterns differ by region, but the underlying questions of mobility, housing and infrastructure recur across the country."]}
  ]
};

function buildNationalArt(){
  spArt.innerHTML="";
  const svgN=el("svg",{class:"national-art",viewBox:`0 0 ${VB.w} ${VB.h}`,preserveAspectRatio:"xMidYMid meet","aria-hidden":"true"},spArt);
  const g=el("g",{},svgN);
  ORDER.forEach(k=>el("path",{class:"nmap-state"+(isLive(k)?" live":""),d:pathOf(k)},g));
  const bb={x:PX(68.5),y:PY(36.9),w:PX(97)-PX(68.5),h:PY(6.5)-PY(36.9)};
  el("rect",{class:"nmap-frame",x:bb.x-12,y:bb.y-12,width:bb.w+24,height:bb.h+24,rx:3},g);
  const t=el("text",{class:"nmap-title",x:bb.x+10,y:bb.y+28},g); t.textContent="NATIONAL DESK";
  const lab=el("text",{class:"nmap-label",x:bb.x+10,y:bb.y+44},g); lab.textContent="ONE COUNTRY · THIRTY-THREE DESKS";
  const n=document.createElement("div"); n.className="art-num"; n.textContent="00"; spArt.appendChild(n);
}

async function renderNational(){
  current="__national__";
  statePage.style.setProperty("--c","#D92243");
  document.documentElement.style.setProperty("--c","#D92243");
  spName.textContent=NATIONAL.name;
  spEp.textContent=NATIONAL.ep;
  spStand.textContent=NATIONAL.stand;
  spIndex.textContent="National desk";
  bcState.textContent="National News";
  spFacts.innerHTML=NATIONAL.facts.map(f=>`<div class="fact"><dt>${f[0]}</dt><dd>${f[1]}</dd></div>`).join("");
  buildNationalArt();
  buildMini("__national__");
  NATIONAL.stories = [];
  renderStoriesData(NATIONAL.stories,"national");
  spScroll.scrollTop=0;
  nextState.innerHTML=`Back to states <i>→</i>`;
  nextState.dataset.k="__back__";
  statePage.setAttribute("aria-hidden","false");
  statePage.removeAttribute("data-open");
  void statePage.offsetWidth;
  statePage.setAttribute("data-open","1");
  try {
    const payload = await getNationalStories();
    const stories = Array.isArray(payload.stories) ? payload.stories.map(backendStory) : [];
    if(stories.length > 0) NATIONAL.stories = stories;
  } catch(error) {
    console.warn("Sutradhar national API unavailable.", error);
  }
  renderStoriesData(NATIONAL.stories,"national");
}

function renderStoriesData(stories,key,limit=12){
  spStories.innerHTML="";
  spCount.textContent=`${stories.length} dispatches · edition 01`;
  stories.slice(0,limit).forEach((st,i)=>{
    const b=document.createElement("button"); b.type="button"; b.className="story"+(i===0?" lead":"");
    const meta=`${feedSummaryMarkup(st.dek)}<span class="by">${st.by} · ${st.read} read</span>`;
    b.innerHTML=`<span class="idx">${String(i+1).padStart(2,"0")}</span>`+
      `<span class="col-a"><span class="cat">${st.cat}<s>${st.date}</s></span><h4>${st.h}</h4>${i===0?meta:""}</span>`+
      (i===0?"":`<span class="col-b">${meta}</span>`);
    b.addEventListener("click",()=>openNationalReader(st));
    bindFeedSummary(b);
    spStories.appendChild(b);
  });
  if(stories.length > limit){
    const more=document.createElement("button");
    more.type="button";
    more.className="story-more";
    more.textContent=`Read more articles · show next ${stories.length - limit}`;
    more.addEventListener("click",()=>renderStoriesData(stories,key,stories.length));
    spStories.appendChild(more);
  }
}
function openNationalReader(st){
  rdKicker.textContent=`National Desk · ${st.cat} · ${st.date}`;
  rdBody.innerHTML=`<h2>${escapeHtml(st.h)}</h2><div class="reader-rule"></div>`+
    (st.kind === "latest" ? articleSummaryMarkup(st.dek) + articleLinkMarkup(st.body[1]) : `<p class="dek">${escapeHtml(st.dek)}</p>` + st.body.map(p=>`<p class="b">${escapeHtml(p)}</p>`).join(""))+
    `<p class="reader-note">${st.kind === "latest" ? "Latest retrieved article" : "Live comparison"} · ${escapeHtml(st.by)} · ${escapeHtml(st.read)}</p>`;
  reader.setAttribute("data-open","1"); reader.setAttribute("aria-hidden","false"); scrim.setAttribute("data-open","1"); rdBody.scrollTop=0;
  if(st.api){
    getStory(st.api.runId, st.api.storyId).then(payload => {
      const articles = payload.articles || [];
      rdBody.innerHTML =
        "<h2>" + escapeHtml(payload.story?.story_title || st.h) + "</h2><div class=\"reader-rule\"></div>" +
        "<p class=\"dek\">Grouped coverage across " + articles.length + " publisher reports.</p>" +
        articles.map(groupedArticleMarkup).join("") +
        "<p class=\"reader-note\">Live national comparison · Sutradhar story API</p>";
    }).catch(error => console.warn("Sutradhar national story detail unavailable.", error));
  }
}

async function selectNational(){
  if(busy || statePage.getAttribute("data-open")==="1") return;
  busy=true;
  readout.classList.remove("on");
  document.documentElement.style.setProperty("--c","#D92243");
  curtain.classList.add("national-curtain");
  curtain.style.background="linear-gradient(180deg,#FF9933 0 33%,#FFF5E5 33% 66%,#138808 66% 100%)";
  mapRoot.setAttribute("data-focus","1");
  if(hovered) setHot(hovered,false);
  hovered=null;
  zoomState("uttar-pradesh",650);
  await wait(700);
  curtainUp();
  await wait(660);
  stage.setAttribute("data-hidden","1");
  // Reveal the national desk on the same cadence as a state desk. Its live
  // stories continue hydrating in the background after the shell is visible.
  void renderNational();
  document.body.classList.add("reading");
  await wait(60);
  curtainDown();
  await wait(760);
  curtain.classList.remove("national-curtain");
  curtain.style.background="";
  busy=false;
}

/* ============================================================
   NAVIGATION — enter, leave, switch
   ============================================================ */
async function select(key){
  if(busy) return;
  if(statePage.getAttribute("data-open") === "1"){ await switchTo(key); return; }
  busy = true;
  readout.classList.remove("on");
  document.documentElement.style.setProperty("--c",STATES[key].a);
  curtain.style.background = STATES[key].a;

  mapRoot.setAttribute("data-focus","1");
  if(hovered && hovered !== key) setHot(hovered,false);
  hovered = key; setHot(key,true);
  zoomState(key,1200);

  if(!isLive(key)){
    await wait(880);
    openSoon(key);
    busy = false;
    return;
  }
  await wait(700);
  curtainUp();
  await wait(660);
  stage.setAttribute("data-hidden","1");
  renderState(key);
  // Start the live request after the page is visible so network latency never
  // blocks the map-to-desk transition. The local shell remains readable while
  // the API response replaces its reference dispatches in the background.
  void hydrateState(key);
  document.body.classList.add("reading");
  await wait(60);
  curtainDown();
  await wait(760);
  busy = false;
}

async function backToIndia(){
  if(busy) return;
  busy = true;
  closeReader();
  curtain.style.background = STATES[current] ? STATES[current].a : "var(--brass)";
  curtainUp();
  await wait(640);
  statePage.removeAttribute("data-open");
  statePage.setAttribute("aria-hidden","true");
  document.body.classList.remove("reading");
  mapRoot.removeAttribute("data-focus");
  if(current && STATES[current]) setHot(current,false);
  hovered = null;

  // Reset the homepage camera while the curtain is still covering the map.
  // This prevents the map from briefly appearing zoomed-in when returning
  // from a state or the National News page.
  zoomOut(700);
  stage.scrollTo({top:0,behavior:"auto"});
  await wait(720);
  stage.removeAttribute("data-hidden");
  curtainDown();
  await wait(760);
  current = null;
  busy = false;
}

async function switchTo(key){
  if(key === "__back__"){ await backToIndia(); return; }
  if(busy) return;
  if(!isLive(key)){
    document.documentElement.style.setProperty("--c",STATES[key].a);
    openSoon(key);
    return;
  }
  if(key === current) return;
  busy = true;
  closeReader();
  curtain.style.background = STATES[key].a;
  curtainUp();
  await wait(640);
  if(current) setHot(current,false);
  setHot(key,true); hovered = key;
  zoomState(key,10);
  renderState(key);
  void hydrateState(key);
  curtainDown();
  await wait(760);
  busy = false;
}

document.getElementById("backBtn").addEventListener("click",backToIndia);
const nextState = document.getElementById("nextState");
nextState.addEventListener("click",()=>switchTo(nextState.dataset.k));

/* ============================================================
   READER
   ============================================================ */
const reader = document.getElementById("reader");
const rdBody = document.getElementById("rdBody");
const rdKicker = document.getElementById("rdKicker");
const scrim = document.getElementById("scrim");

function openReader(key,i){
  const st = STATES[key].stories[i];
  rdKicker.textContent = `${label(key)} · ${st.cat} · ${st.date}`;
  rdBody.innerHTML =
    `<h2>${escapeHtml(st.h)}</h2><div class="reader-rule"></div>` +
    (st.kind === "latest" ? articleSummaryMarkup(st.dek) + articleLinkMarkup(st.body[1]) : `<p class="dek">${escapeHtml(st.dek)}</p>` + st.body.map(p=>`<p class="b">${escapeHtml(p)}</p>`).join("")) +
    `<p class="reader-note">${st.kind === "latest" ? "Live article" : "Live comparison"} · ${escapeHtml(st.by)} · ${escapeHtml(st.read)} read</p>` +
    `<p class="reader-fine">Written to show how a filed dispatch reads inside SUTRADHAR. None of it is real reporting.</p>`;
  reader.setAttribute("data-open","1");
  reader.setAttribute("aria-hidden","false");
  scrim.setAttribute("data-open","1");
  rdBody.scrollTop = 0;
  if(st.api){
    getStory(st.api.runId, st.api.storyId).then(payload => {
      const articles = payload.articles || [];
      rdBody.innerHTML =
        "<h2>" + escapeHtml(payload.story?.story_title || st.h) + "</h2><div class=\"reader-rule\"></div>" +
        "<p class=\"dek\">Grouped coverage across " + articles.length + " publisher reports.</p>" +
        articles.map(groupedArticleMarkup).join("") +
        "<p class=\"reader-note\">Live comparison · Sutradhar story API</p>";
    }).catch(error => console.warn("Sutradhar story detail unavailable.", error));
  }
}
function closeReader(){
  reader.removeAttribute("data-open");
  reader.setAttribute("aria-hidden","true");
  scrim.removeAttribute("data-open");
}
document.getElementById("rdClose").addEventListener("click",closeReader);
scrim.addEventListener("click",closeReader);

/* ============================================================
   COMING SOON
   ============================================================ */
const soon = document.getElementById("soon");
function openSoon(key){
  const s = STATES[key];
  soon.style.setProperty("--c",s.a);
  document.getElementById("soonIdx").textContent = `State ${INDEX[key]} of ${PAD2} · ${s.cap}`;
  document.getElementById("soonName").innerHTML = s.name;
  document.getElementById("soonCopy").textContent =
    `${label(key)} is mapped and wired into the atlas, but its desk has not filed yet. ` +
    `Its dispatches open the moment someone writes them.`;
  const bb = bboxOf(key), pad = Math.max(bb.w,bb.h)*0.12;
  const shape = document.getElementById("soonShape");
  shape.innerHTML = "";
  const sv = el("svg",{viewBox:`${bb.x-pad} ${bb.y-pad} ${bb.w+pad*2} ${bb.h+pad*2}`,preserveAspectRatio:"xMidYMid meet"},shape);
  el("path",{d:pathOf(key)},sv);
  soon.setAttribute("data-open","1");
}
async function closeSoon(){
  soon.removeAttribute("data-open");
  if(statePage.getAttribute("data-open") === "1") return;
  mapRoot.removeAttribute("data-focus");
  if(hovered) setHot(hovered,false);
  hovered = null;
  zoomOut(900);
}
document.getElementById("soonClose").addEventListener("click",closeSoon);
soon.addEventListener("click",e=>{ if(e.target === soon) closeSoon(); });
document.getElementById("soonUP").addEventListener("click",async()=>{
  soon.removeAttribute("data-open");
  if(statePage.getAttribute("data-open") === "1") switchTo("uttar-pradesh");
  else { mapRoot.removeAttribute("data-focus"); if(hovered) setHot(hovered,false); hovered=null; select("uttar-pradesh"); }
});
document.getElementById("soonMH").addEventListener("click",async()=>{
  soon.removeAttribute("data-open");
  if(statePage.getAttribute("data-open") === "1") switchTo("maharashtra");
  else { mapRoot.removeAttribute("data-focus"); if(hovered) setHot(hovered,false); hovered=null; select("maharashtra"); }
});

/* ============================================================
   NATIONAL NEWS
   ============================================================ */
const nationalBtn = document.getElementById("nationalBtn");
nationalBtn.addEventListener("click",selectNational);
nationalBtn.addEventListener("pointerenter",e=>{showNationalReadout();placeReadout(e);});
nationalBtn.addEventListener("pointermove",placeReadout);
nationalBtn.addEventListener("pointerleave",()=>readout.classList.remove("on"));

/* ============================================================
   SWITCHER
   ============================================================ */
const switcher = document.getElementById("switcher");
const swGrid = document.getElementById("swGrid");
KEYS.forEach(k=>{
  const s = STATES[k];
  const b = document.createElement("button");
  b.type = "button";
  b.className = "sw-item";
  b.style.setProperty("--c",s.a);
  if(isLive(k)) b.dataset.live = "1";
  b.innerHTML = `<b>${s.name}</b><span class="micro">${INDEX[k]} / ${PAD2} · ${isLive(k) ? s.stories.length + " dispatches" : "not filed yet"}</span>`;
  b.addEventListener("click",()=>{ switcher.removeAttribute("data-open"); switchTo(k); });
  swGrid.appendChild(b);
});
document.getElementById("switchBtn").addEventListener("click",()=>switcher.setAttribute("data-open","1"));
document.getElementById("swClose").addEventListener("click",()=>switcher.removeAttribute("data-open"));


/* ============================================================
   PRINTING PRESS → INTERNAL PROCESSING
   The AWS run-status API is the source of truth for this view.
   ============================================================ */
const printPress = document.getElementById("printPress");
const pressFrame = printPress.querySelector(".print-press-frame");
const pressLook = printPress.querySelector(".press-look");
const pressStoryAction = document.getElementById("pressStoryAction");
const pipelineView = document.getElementById("pipelineView");
const pipelineGrid = document.getElementById("pipelineGrid");
const pipelineBoard = document.getElementById("pipelineBoard");
const pipelineWires = document.getElementById("pipelineWires");
const pipelineOutput = document.getElementById("pipelineOutput");
const outputIndia = document.getElementById("outputIndia");
const outputRail = document.getElementById("outputRail");
const outputFeeds = document.getElementById("outputFeeds");
const pipelineClose = document.getElementById("pipelineClose");
const pipelineRun = document.getElementById("pipelineRun");
const pipelineExit = document.getElementById("pipelineExit");
const awsArchitecture = document.getElementById("awsArchitecture");
function setAwsRunState(status){
  if(!awsArchitecture) return;
  awsArchitecture.dataset.runStatus = status;
}
function updateAwsServices(stages = [], runStatus = ""){
  if(!awsArchitecture) return;
  const active = new Set();
  if(runStatus === "ready") active.add("s3");
  if(runStatus === "queued" || runStatus === "running") active.add("s3");
  const running = stages.filter(stage=>String(stage.status || "").toLowerCase() === "running");
  if(runStatus === "queued") { active.add("api"); active.add("processing"); }
  running.forEach(stage=>{
    const id = String(stage.stage_id || "");
    if(id === "fetch_sources") active.add("s3");
    if(id !== "persist_outputs") { active.add("api"); active.add("processing"); }
    if(id === "persist_outputs") active.add("dynamo");
  });
  awsArchitecture.querySelectorAll("[data-service]").forEach(node=>node.classList.toggle("is-active", active.has(node.dataset.service)));
}
const PIPE_STAGES = [
  ["fetch_sources","FETCH RSS SOURCES"],
  ["parse_articles","PARSE ARTICLE ENTRIES"],
  ["normalize_articles","NORMALIZE ARTICLE METADATA"],
  ["deduplicate_articles","DEDUPLICATE ARTICLES"],
  ["classify_states","CLASSIFY STATE RELEVANCE"],
  ["tfidf_vectorization","BUILD TF-IDF FEATURES"],
  ["neighbor_retrieval","RETRIEVE SPARSE HEADLINE NEIGHBORS"],
  ["weighted_tfidf_scoring","SCORE WEIGHTED TF-IDF CANDIDATES"],
  ["keyword_entity_signals","EVALUATE KEYWORD / ENTITY / TIME SIGNALS"],
  ["graph_clustering","BUILD STORY GRAPH CLUSTERS"],
  ["rank_stories","RANK AND NAME STORIES"],
  ["persist_outputs","PERSIST RESULTS TO DYNAMODB"],
];
let pipelineTimer=[];
function clearPipelineTimers(){pipelineTimer.forEach(clearTimeout);pipelineTimer=[];}
function buildPipeline(){
  pipelineGrid.innerHTML="";
  PIPE_STAGES.forEach((d,i)=>{
    const n=document.createElement("article"); n.className="pipe-node"; n.dataset.i=i; n.dataset.stageId=d[0]; n.dataset.status="queued";
    n.innerHTML=`<div class="pipe-num">NODE ${String(i+1).padStart(2,"0")} / ${String(PIPE_STAGES.length).padStart(2,"0")}</div><div class="pipe-name">${d[1]}</div><div class="pipe-data">AWAITING TELEMETRY</div><div class="pipe-micro">BACKEND STAGE / ${d[0].replaceAll("_"," ")}</div><div class="pipe-status">QUEUED</div>`;
    pipelineGrid.appendChild(n);
  });
  outputFeeds.innerHTML="";
  pipelineOutput.classList.remove("is-visible");
  outputIndia.innerHTML="";
  outputIndia.classList.remove("live");
  outputRail.classList.remove("live");
  pipelineView.classList.remove("pipeline-done");
  drawPipelineWires();
}
function drawPipelineWires(){
  if(!pipelineWires || !pipelineBoard) return;
  const boardRect=pipelineBoard.getBoundingClientRect();
  pipelineWires.setAttribute("viewBox",`0 0 ${Math.max(1,boardRect.width)} ${Math.max(1,boardRect.height)}`);
  pipelineWires.innerHTML="";
  const nodes=[...pipelineGrid.children];
  const ns=[];
  nodes.forEach((node,i)=>{
    const r=node.getBoundingClientRect();
    ns.push({x:r.left-boardRect.left,y:r.top-boardRect.top,w:r.width,h:r.height,cx:r.left-boardRect.left+r.width/2,cy:r.top-boardRect.top+r.height/2});
  });
  for(let i=0;i<ns.length-1;i++){
    const a=ns[i],b=ns[i+1];
    const sameRow=Math.abs(a.cy-b.cy)<8;
    let d;
    if(sameRow) d=`M ${a.x+a.w} ${a.cy} L ${b.x} ${b.cy}`;
    else { const sx=a.cx,sy=a.y+a.h, ex=b.cx,ey=b.y; const mid=(sy+ey)/2; d=`M ${sx} ${sy} L ${sx} ${mid} L ${ex} ${mid} L ${ex} ${ey}`; }
    const path=el("path",{class:"pipeline-wire",d},pipelineWires); path.dataset.i=i;
    if(i===PIPE_STAGES.length-2) path.classList.add("output");
  }
}
function setPipeStatus(i,status){
  const n=pipelineGrid.children[i]; if(!n) return;
  n.dataset.status=status;
  const st=n.querySelector(".pipe-status"); if(st) st.textContent=status.toUpperCase();
  const wire=pipelineWires.querySelector(`.pipeline-wire[data-i="${i-1}"]`); if(wire && status!=="queued") wire.classList.add("active");
}
function addPacket(path){
  const len=path.getTotalLength ? path.getTotalLength() : 100;
  const c=el("circle",{class:"pipeline-particle",r:3},pipelineWires);
  c.classList.add("on");
  const t0=performance.now(),dur=620;
  function f(now){
    const p=Math.min(1,(now-t0)/dur), pt=path.getPointAtLength(len*p); c.setAttribute("cx",pt.x);c.setAttribute("cy",pt.y);
    if(p<1) requestAnimationFrame(f); else c.remove();
  }
  requestAnimationFrame(f);
}
function highlightOutput(run={}){
  const groups = run.grouping_summary?.state_groups || [];
  const feeds = groups
    .filter(group => Number(group.story_count) > 0)
    .sort((a,b) => Number(b.story_count) - Number(a.story_count))
    .slice(0, 8)
    .map(group => {
      const key = Object.keys(STATES).find(candidate => STATES[candidate].name.toLowerCase() === String(group.state).toLowerCase());
      return key ? [key, STATES[key].name, `${Number(group.story_count)} STORIES`] : null;
    })
    .filter(Boolean);
  const visibleFeeds = feeds.length ? feeds : Object.entries(STATES)
    .filter(([key]) => isLive(key))
    .sort((a,b) => b[1].stories.length - a[1].stories.length)
    .slice(0, 6)
    .map(([key,state]) => [key, state.name, `${state.stories.length} REFERENCE STORIES`]);
  pipelineOutput.classList.add("is-visible");
  outputIndia.classList.add("live");
  outputRail.classList.add("live");
  outputIndia.innerHTML=`<svg viewBox="0 0 ${VB.w} ${VB.h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><g transform="translate(18 8) scale(.31)">${gStates.innerHTML}</g></svg>`;
  [...outputIndia.querySelectorAll(".hit,.marks,.patfill")].forEach(e=>e.remove());
  const nodes=[...outputIndia.querySelectorAll(".st")];
  nodes.forEach((n,i)=>{ if(i%4===0) n.classList.add("hot"); });
  visibleFeeds.forEach(([key,name,count],i)=>setTimeout(()=>{
    const chip=document.createElement("span");
    chip.className="output-chip";
    chip.innerHTML=`<svg class="output-state-map" viewBox="0 0 ${VB.w} ${VB.h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="${pathOf(key)}"></path></svg><b>${name}</b><span>${count}</span>`;
    outputFeeds.appendChild(chip);
    requestAnimationFrame(()=>chip.classList.add("show"));
  },i*180));
  pipelineView.classList.add("pipeline-done");
}
let backendPollTimer = null;
let backendRunFinished = false;
function setPipelineError(message){
  setAwsRunState("failed");
  pipelineView.dataset.backendError="1";
  const first = pipelineGrid.children[0];
  if(first) {
    setPipeStatus(0,"failed");
    const data = first.querySelector(".pipe-data");
    const micro = first.querySelector(".pipe-micro");
    if(data) data.textContent = "BACKEND RUN UNAVAILABLE";
    if(micro) micro.textContent = message.slice(0, 90).toUpperCase();
  }
  console.error("Sutradhar backend processing unavailable:", message);
}
function applyBackendRun(run){
  const stages = Array.isArray(run.stage_progress) ? run.stage_progress : [];
  stages.forEach((stage)=>{
    const node = [...pipelineGrid.children].find(item => item.dataset.stageId === stage.stage_id);
    if(!node) return;
    const i = Number(node.dataset.i);
    const status = String(stage.status || "queued").toLowerCase();
    setPipeStatus(i, status);
    if(status === "running" && !node.dataset.packetSent){
      node.dataset.packetSent = "1";
      const incoming=pipelineWires.querySelector(`.pipeline-wire[data-i="${i-1}"]`);
      if(incoming) addPacket(incoming);
    }
    const metrics = Object.entries(stage.metrics || {}).slice(0,2).map(pair => pair[0].replaceAll("_"," ") + ": " + pair[1]);
    const data = node.querySelector(".pipe-data");
    const micro = node.querySelector(".pipe-micro");
    if(metrics[0] && data) data.textContent = metrics[0].toUpperCase();
    if(metrics[1] && micro) micro.textContent = metrics[1].toUpperCase();
  });
  const runStatus = String(run.status || "").toLowerCase();
  setAwsRunState(runStatus || "running");
  updateAwsServices(stages, runStatus);
  if(runStatus === "completed" && !backendRunFinished){
    backendRunFinished = true;
    hydrateAllStates(true);
    highlightOutput(run);
  } else if((runStatus === "failed" || runStatus === "error") && !backendRunFinished){
    backendRunFinished = true;
    setPipelineError(run.error || "PROCESSING RUN FAILED");
  }
  if(runStatus === "completed" || runStatus === "failed" || runStatus === "error"){
    if(backendPollTimer) clearTimeout(backendPollTimer);
    backendPollTimer = null;
  }
}
async function beginBackendRun(){
  try {
    const accepted = await startProcessing();
    if(!accepted.run_id) throw new Error("No run ID returned by the processing API");
    let pollFailures = 0;
    const poll = async () => {
      try {
        const run = await getRunStatus(accepted.run_id);
        pollFailures = 0;
        applyBackendRun(run);
        const runStatus = String(run.status || "").toLowerCase();
        if(runStatus !== "completed" && runStatus !== "failed" && runStatus !== "error"){
          backendPollTimer = setTimeout(poll, 900);
        }
      } catch(error) {
        pollFailures += 1;
        if(pollFailures < 6){
          backendPollTimer = setTimeout(poll, 1500);
        }else{
          setPipelineError(error.message || "RUN STATUS REQUEST FAILED");
        }
      }
    };
    poll();
  } catch(error) {
    setPipelineError(error.message || "PROCESSING TRIGGER FAILED");
  }
}
const pressSection = document.getElementById("pressSection");
if(pressSection && "IntersectionObserver" in window){
  const pressObserver = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{ if(entry.isIntersecting) pressSection.classList.add("is-visible"); });
  },{root:stage,threshold:.18});
  pressObserver.observe(pressSection);
}else if(pressSection){ pressSection.classList.add("is-visible"); }

function startPipeline(){
  clearPipelineTimers();
  backendRunFinished = false;
  delete pipelineView.dataset.backendError;
  pipelineRun.disabled = true;
  pipelineRun.classList.add("is-running");
  setAwsRunState("queued");
  pipelineRun.querySelector("span").textContent = "PIPELINE RUNNING";
  buildPipeline();
  beginBackendRun();
}
async function enterPipeline(){
  if(busy || pipelineView.getAttribute("data-open")==="1") return;
  busy=true; clearPipelineTimers();
  readout.classList.remove("on");
  printPress.classList.add("press-active");
  await wait(620);
  stage.setAttribute("data-hidden","1");
  pipelineView.setAttribute("aria-hidden","false");
  pipelineView.setAttribute("data-open","1");
  await wait(820);
  buildPipeline();
  drawPipelineWires();
  busy=false;
}
async function endPipelineToMap(){
  if(pipelineView.getAttribute("data-open")!=="1") return;
  busy=true; clearPipelineTimers();
  // Send a final visual pulse back to the real map before closing the machine view.
  pipelineView.classList.add("pipeline-done");
  await wait(500);
  pipelineView.removeAttribute("data-open");
  pipelineView.setAttribute("aria-hidden","true");
  stage.removeAttribute("data-hidden");
  stage.scrollTo({top:0,behavior:"auto"});
  printPress.classList.remove("press-active");
  // briefly highlight a few existing states as processed output, then restore normal interaction.
  const pulse=["maharashtra","karnataka","west-bengal","tamil-nadu","uttar-pradesh"];
  pulse.forEach(k=>{ if(vis[k]) vis[k].classList.add("pipeline-hit"); });
  await wait(1050);
  pulse.forEach(k=>{ if(vis[k]) vis[k].classList.remove("pipeline-hit"); });
  pipelineView.classList.remove("pipeline-done");
  pipelineRun.disabled = false;
  pipelineRun.classList.remove("is-running");
  pipelineRun.querySelector("span").textContent = "RUN PIPELINE";
  busy=false;
}
async function closePipeline(){
  if(busy) return;
  busy=true; clearPipelineTimers();
  pipelineView.removeAttribute("data-open");
  pipelineView.setAttribute("aria-hidden","true");
  await wait(720);
  stage.removeAttribute("data-hidden");
  printPress.classList.remove("press-active");
  pipelineView.classList.remove("pipeline-done");
  pipelineRun.disabled = false;
  pipelineRun.classList.remove("is-running");
  pipelineRun.querySelector("span").textContent = "RUN PIPELINE";
  busy=false;
}
function placePressLook(e){
  if(!pressFrame || !pressLook || window.matchMedia("(max-width:760px)").matches) return;
  const frame = pressFrame.getBoundingClientRect();
  const card = pressLook.getBoundingClientRect();
  let x = e.clientX - frame.left + 22;
  let y = e.clientY - frame.top - card.height / 2;
  if(x + card.width > frame.width - 12) x = e.clientX - frame.left - card.width - 22;
  y = Math.max(12, Math.min(frame.height - card.height - 12, y));
  pressLook.style.left = x + "px";
  pressLook.style.top = y + "px";
}
printPress.addEventListener("click",enterPipeline);
printPress.addEventListener("pointerenter",placePressLook);
printPress.addEventListener("pointermove",placePressLook);
pressStoryAction.addEventListener("click",enterPipeline);
pipelineRun.addEventListener("click",startPipeline);
pipelineExit.addEventListener("click",closePipeline);
pipelineClose.addEventListener("click",closePipeline);
window.addEventListener("resize",()=>{if(pipelineView.getAttribute("data-open")==="1") drawPipelineWires();});

/* ============================================================
   KEYBOARD
   ============================================================ */
document.addEventListener("keydown",e=>{
  if(e.key !== "Escape") return;
  if(nationalNews.getAttribute("data-open") === "1"){ closeNational(); return; }
  if(switcher.getAttribute("data-open") === "1"){ switcher.removeAttribute("data-open"); return; }
  if(reader.getAttribute("data-open") === "1"){ closeReader(); return; }
  if(soon.getAttribute("data-open") === "1"){ closeSoon(); return; }
  if(pipelineView.getAttribute("data-open") === "1"){ closePipeline(); return; }
  if(statePage.getAttribute("data-open") === "1") backToIndia();
});

/* ============================================================
   BOOT
   ============================================================ */
applyCam(1,VB.w/2,VB.h/2);
const overture = document.getElementById("overture");
const startDelay = REDUCED ? 120 : 1450;
setTimeout(()=>{
  stage.setAttribute("data-ready","1");
  overture.setAttribute("data-done","1");
}, startDelay);
setTimeout(()=>{ overture.style.display = "none"; }, startDelay + 1400);

function hydrateBackend(){
  hydrateMarket();
  setAwsRunState("ready");
  updateAwsServices([], "ready");
  // Clear authored reference copy before loading live projections. The map
  // remains navigable, but no fictional dispatch is shown as current news.
  KEYS.forEach(key=>{
    STATES[key].stories = [];
    STATES[key].facts = [["Total articles", "Loading"], ["Grouped articles", "Loading"], ["Latest reports", "Loading"], ["Capital", STATES[key].cap]];
  });
  // Load the latest persisted state projections quietly. The printing press
  // remains the explicit action that starts a fresh processing run.
  // Load the states shown on the front page first, then fill the rest of the
  // map quietly. This keeps the coverage panel useful immediately without
  // delaying the map or any state transition.
  void Promise.all(FEATURED.map(key=>hydrateState(key)))
    .then(()=>hydrateAllStates(false, FEATURED));
}
hydrateBackend();

}
