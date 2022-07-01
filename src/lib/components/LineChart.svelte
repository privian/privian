<script lang="ts">
	import { Chart } from 'frappe-charts';
	import { afterUpdate, onMount } from 'svelte';

	export let data: Array<Array<string | number>>;
	export let height: number = 150;

	let chart: any;
	let el: HTMLElement;

	afterUpdate(() => {
		if (chart) {
			chart.update(getData());
		}
	});

	onMount(() => {
		init();
	});

	function getData() {
		return {
			labels: data.find((item) => item[0] === 'x')?.slice(1),
			datasets: data.filter((item) => item[0] !== 'x').map((item) => {
				return {
					name: item[0],
					values: item.slice(1),
				};
			}),
		};
	}

	function init() {
		chart = new Chart(el, {
			data: getData(),
			type: 'line',
			height,
			colors: ['green', 'blue', 'purple'],
			axisOptions: {
				xAxisMode: 'tick',
				xIsSeries: 1
			},
			lineOptions: {
				regionFill: 1,
			},
		});
	}
</script>

<div bind:this={el} />
