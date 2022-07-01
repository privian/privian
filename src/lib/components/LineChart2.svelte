<script lang="ts">
	import { AreaChart } from '@carbon/charts-svelte';
	import '@carbon/charts/styles.min.css';
	// import "carbon-components/css/carbon-components.min.css";

	interface IDataItem {
		date?: string;
		group?: string;
		key?: string;
		value?: number;
	}

	export let data: IDataItem[];
	export let height: number = 120;
	export let title: string | null = null;
	export let tooltipFn: ((data: IDataItem[]) => string) | null = null;

	$: maxValue = Math.max(...data.map(({ value }) => value!));
	$: minValue = Math.min(...data.map(({ value }) => value!));
	$: normalizedData = data.map((item) => {
		if (!item.group) {
			item.group = 'Default';
		}
		return item;
	});
</script>

<AreaChart
	data={normalizedData}
	options={{
	"title": title,
	"axes": {
		"left": {
			"visible": false,
			"includeZero": false,
			"mapsTo": "value",
			"scaleType": "linear",
			"domain": [
				minValue,
				maxValue,
			]
		},
		"bottom": {
			"scaleType": "time",
			"mapsTo": "date",
			"_visible": false,
			"truncation": {
				"type": "mid_line",
				"threshold": 10,
				"numCharacter": 14
			},
		}
	},
	"legend": {
		"clickable": false,
		"enabled": false,
	},
	"toolbar": {
		"enabled": false
	},
	"tooltip": {
		customHTML: tooltipFn,
	},
	"grid": {
		"x": {
			"enabled": false
		}
	},
	"color": {
		"scale": {
			"Default": "green",
		}
	},
	"height": `${height}px`
}}
	/>

<style>
	:global(.cds--cc--grid rect.chart-grid-backdrop.stroked) {
		stroke: none;
	}
	:global(.cds--cc--axes .chart-grid-backdrop .tick) {
		opacity: 0.5;
	}
</style>
