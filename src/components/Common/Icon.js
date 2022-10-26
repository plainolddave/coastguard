import React, { useMemo } from "react";

import {
	WiBarometer,
	WiCloud,
	WiHumidity,
	WiThermometer,
	WiSunrise,
	WiSunset,
	WiWindBeaufort0,
	WiWindBeaufort1,
	WiWindBeaufort2,
	WiWindBeaufort3,
	WiWindBeaufort4,
	WiWindBeaufort5,
	WiWindBeaufort6,
	WiWindBeaufort7,
	WiWindBeaufort8,
	WiWindBeaufort9,
	WiWindBeaufort10,
	WiWindBeaufort11,
	WiWindBeaufort12
} from "react-icons/wi";

import {
	GoGlobe,
	GoArrowUp,
	GoArrowDown,
	GoArrowRight,
	GoArrowLeft,
	GoCalendar,
	GoHistory,
	GoLocation,
	GoBug
} from "react-icons/go";

import {
	GiPositionMarker
} from "react-icons/gi";

function Icon({ name }) {

	const getIcon = useMemo(
		() => {
			switch (name) {
				case 'Pressure':
					return <WiBarometer />;
				case 'Cloud':
					return <WiCloud />;
				case 'Humidity':
					return <WiHumidity />;
				case 'Temp':
					return <WiThermometer />;
				case 'Sunrise':
					return <WiSunrise />;
				case 'Sunset':
					return <WiSunset />;
				case 'Up':
				case 'High':
					return <GoArrowUp />;
				case 'Low':
				case 'Down':
					return <GoArrowDown />;
				case 'Right':
					return <GoArrowRight />;
				case 'Left':
					return <GoArrowLeft />;
				case 'Here':
					return <GoLocation />;
				case 'Place':
					return <GiPositionMarker />;
				case 'Wind0':
					return <WiWindBeaufort0 />;
				case 'Wind1':
					return <WiWindBeaufort1 />;
				case 'Wind2':
					return <WiWindBeaufort2 />;
				case 'Wind3':
					return <WiWindBeaufort3 />;
				case 'Wind4':
					return <WiWindBeaufort4 />;
				case 'Wind5':
					return <WiWindBeaufort5 />;
				case 'Wind6':
					return <WiWindBeaufort6 />;
				case 'Wind7':
					return <WiWindBeaufort7 />;
				case 'Wind8':
					return <WiWindBeaufort8 />;
				case 'Wind9':
					return <WiWindBeaufort9 />;
				case 'Wind10':
					return <WiWindBeaufort10 />;
				case 'Wind11':
					return <WiWindBeaufort11 />;
				case 'Wind12':
					return <WiWindBeaufort12 />;
				case 'Globe':
					return <GoGlobe />;
				case 'History':
					return <GoHistory />;
				case 'Calendar':
					return <GoCalendar />;
				default:
					return <GoBug />;
			}
		},
		[name],
	);
	return getIcon;
}

export default Icon;