'use strict';

/**
 * This module adds a directive for adding two way binding to a hidden input field
 */
angular.module('hiddenInputBinding', [])
/**
 * A directive for adding two way binding to a hidden input field
 *
 * <code>
 *   <input type="hidden" name="item.Name" ng-model="item.Name" ng-update-hidden />
 * </code>
 */
	.directive('ngUpdateHidden', function () {
		return {
			restrict: 'AE', //attribute or element
			scope: {},
			replace: true,
			require: 'ngModel',
			link: function ($scope, elem, attr, ngModel) {
				$scope.$watch(ngModel, function (nv) {
					elem.val(nv);
				});
				elem.change(function () { //bind the change event to hidden input
					$scope.$apply(function () {
						ngModel.$setViewValue(  elem.val());
					});
				});
			}
		};
	});