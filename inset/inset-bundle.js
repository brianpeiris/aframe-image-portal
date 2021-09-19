(() => {
  // node_modules/@flatten-js/core/dist/main.esm.js
  var CCW = true;
  var CW = false;
  var ORIENTATION = { CCW: -1, CW: 1, NOT_ORIENTABLE: 0 };
  var PIx2 = 2 * Math.PI;
  var INSIDE = 1;
  var OUTSIDE = 0;
  var BOUNDARY = 2;
  var CONTAINS = 3;
  var INTERLACE = 4;
  var OVERLAP_SAME = 1;
  var OVERLAP_OPPOSITE = 2;
  var Constants = /* @__PURE__ */ Object.freeze({
    CCW,
    CW,
    ORIENTATION,
    PIx2,
    INSIDE,
    OUTSIDE,
    BOUNDARY,
    CONTAINS,
    INTERLACE,
    OVERLAP_SAME,
    OVERLAP_OPPOSITE
  });
  var DP_TOL = 1e-6;
  function setTolerance(tolerance) {
    DP_TOL = tolerance;
  }
  function getTolerance() {
    return DP_TOL;
  }
  var DECIMALS = 3;
  function EQ_0(x) {
    return x < DP_TOL && x > -DP_TOL;
  }
  function EQ(x, y) {
    return x - y < DP_TOL && x - y > -DP_TOL;
  }
  function GT(x, y) {
    return x - y > DP_TOL;
  }
  function GE(x, y) {
    return x - y > -DP_TOL;
  }
  function LT(x, y) {
    return x - y < -DP_TOL;
  }
  function LE(x, y) {
    return x - y < DP_TOL;
  }
  var Utils = /* @__PURE__ */ Object.freeze({
    setTolerance,
    getTolerance,
    DECIMALS,
    EQ_0,
    EQ,
    GT,
    GE,
    LT,
    LE
  });
  var Errors = class {
    static get ILLEGAL_PARAMETERS() {
      return new ReferenceError("Illegal Parameters");
    }
    static get ZERO_DIVISION() {
      return new Error("Zero division");
    }
    static get UNRESOLVED_BOUNDARY_CONFLICT() {
      return new Error("Unresolved boundary conflict in boolean operation");
    }
    static get INFINITE_LOOP() {
      return new Error("Infinite loop");
    }
  };
  var Flatten = {
    Utils,
    Errors,
    Matrix: void 0,
    Planar_set: void 0,
    Point: void 0,
    Vector: void 0,
    Line: void 0,
    Circle: void 0,
    Segment: void 0,
    Arc: void 0,
    Box: void 0,
    Edge: void 0,
    Face: void 0,
    Ray: void 0,
    Ray_shooting: void 0,
    Multiline: void 0,
    Polygon: void 0,
    Distance: void 0
  };
  for (let c in Constants) {
    Flatten[c] = Constants[c];
  }
  Object.defineProperty(Flatten, "DP_TOL", {
    get: function() {
      return getTolerance();
    },
    set: function(value) {
      setTolerance(value);
    }
  });
  var LinkedList = class {
    constructor(first, last) {
      this.first = first;
      this.last = last || this.first;
    }
    static testInfiniteLoop(first) {
      let edge = first;
      let controlEdge = first;
      do {
        if (edge != first && edge === controlEdge) {
          throw Flatten.Errors.INFINITE_LOOP;
        }
        edge = edge.next;
        controlEdge = controlEdge.next.next;
      } while (edge != first);
    }
    get size() {
      let counter = 0;
      for (let edge of this) {
        counter++;
      }
      return counter;
    }
    toArray(start = void 0, end = void 0) {
      let elements = [];
      let from = start || this.first;
      let to = end || this.last;
      let element = from;
      if (element === void 0)
        return elements;
      do {
        elements.push(element);
        element = element.next;
      } while (element !== to.next);
      return elements;
    }
    append(element) {
      if (this.isEmpty()) {
        this.first = element;
      } else {
        element.prev = this.last;
        this.last.next = element;
      }
      this.last = element;
      this.last.next = void 0;
      this.first.prev = void 0;
      return this;
    }
    insert(newElement, elementBefore) {
      if (this.isEmpty()) {
        this.first = newElement;
        this.last = newElement;
      } else if (elementBefore === null || elementBefore === void 0) {
        newElement.next = this.first;
        this.first.prev = newElement;
        this.first = newElement;
      } else {
        let elementAfter = elementBefore.next;
        elementBefore.next = newElement;
        if (elementAfter)
          elementAfter.prev = newElement;
        newElement.prev = elementBefore;
        newElement.next = elementAfter;
        if (this.last === elementBefore)
          this.last = newElement;
      }
      this.last.next = void 0;
      this.first.prev = void 0;
      return this;
    }
    remove(element) {
      if (element === this.first && element === this.last) {
        this.first = void 0;
        this.last = void 0;
      } else {
        if (element.prev)
          element.prev.next = element.next;
        if (element.next)
          element.next.prev = element.prev;
        if (element === this.first) {
          this.first = element.next;
        }
        if (element === this.last) {
          this.last = element.prev;
        }
      }
      return this;
    }
    isEmpty() {
      return this.first === void 0;
    }
    [Symbol.iterator]() {
      let value = void 0;
      return {
        next: () => {
          value = value ? value.next : this.first;
          return { value, done: value === void 0 };
        }
      };
    }
  };
  var { INSIDE: INSIDE$1, OUTSIDE: OUTSIDE$1, BOUNDARY: BOUNDARY$1, OVERLAP_SAME: OVERLAP_SAME$1, OVERLAP_OPPOSITE: OVERLAP_OPPOSITE$1 } = Flatten;
  var NOT_VERTEX = 0;
  var START_VERTEX = 1;
  var END_VERTEX = 2;
  var BOOLEAN_UNION = 1;
  var BOOLEAN_INTERSECT = 2;
  var BOOLEAN_SUBTRACT = 3;
  function unify(polygon1, polygon2) {
    let [res_poly, wrk_poly] = booleanOpBinary(polygon1, polygon2, BOOLEAN_UNION, true);
    return res_poly;
  }
  function subtract(polygon1, polygon2) {
    let polygon2_tmp = polygon2.clone();
    let polygon2_reversed = polygon2_tmp.reverse();
    let [res_poly, wrk_poly] = booleanOpBinary(polygon1, polygon2_reversed, BOOLEAN_SUBTRACT, true);
    return res_poly;
  }
  function intersect(polygon1, polygon2) {
    let [res_poly, wrk_poly] = booleanOpBinary(polygon1, polygon2, BOOLEAN_INTERSECT, true);
    return res_poly;
  }
  function innerClip(polygon1, polygon2) {
    let [res_poly, wrk_poly] = booleanOpBinary(polygon1, polygon2, BOOLEAN_INTERSECT, false);
    let clip_shapes1 = [];
    for (let face of res_poly.faces) {
      clip_shapes1 = [...clip_shapes1, ...[...face.edges].map((edge) => edge.shape)];
    }
    let clip_shapes2 = [];
    for (let face of wrk_poly.faces) {
      clip_shapes2 = [...clip_shapes2, ...[...face.edges].map((edge) => edge.shape)];
    }
    return [clip_shapes1, clip_shapes2];
  }
  function outerClip(polygon1, polygon2) {
    let [res_poly, wrk_poly] = booleanOpBinary(polygon1, polygon2, BOOLEAN_SUBTRACT, false);
    let clip_shapes1 = [];
    for (let face of res_poly.faces) {
      clip_shapes1 = [...clip_shapes1, ...[...face.edges].map((edge) => edge.shape)];
    }
    return clip_shapes1;
  }
  function calculateIntersections(polygon1, polygon2) {
    let res_poly = polygon1.clone();
    let wrk_poly = polygon2.clone();
    let intersections = getIntersections(res_poly, wrk_poly);
    sortIntersections(intersections);
    splitByIntersections(res_poly, intersections.int_points1_sorted);
    splitByIntersections(wrk_poly, intersections.int_points2_sorted);
    filterDuplicatedIntersections(intersections);
    let ip_sorted1 = intersections.int_points1_sorted.map((int_point) => int_point.pt);
    let ip_sorted2 = intersections.int_points2_sorted.map((int_point) => int_point.pt);
    return [ip_sorted1, ip_sorted2];
  }
  function filterNotRelevantEdges(res_poly, wrk_poly, intersections, op) {
    let notIntersectedFacesRes = getNotIntersectedFaces(res_poly, intersections.int_points1);
    let notIntersectedFacesWrk = getNotIntersectedFaces(wrk_poly, intersections.int_points2);
    calcInclusionForNotIntersectedFaces(notIntersectedFacesRes, wrk_poly);
    calcInclusionForNotIntersectedFaces(notIntersectedFacesWrk, res_poly);
    initializeInclusionFlags(intersections.int_points1);
    initializeInclusionFlags(intersections.int_points2);
    calculateInclusionFlags(intersections.int_points1, wrk_poly);
    calculateInclusionFlags(intersections.int_points2, res_poly);
    while (fixBoundaryConflicts(res_poly, wrk_poly, intersections.int_points1, intersections.int_points1_sorted, intersections.int_points2, intersections))
      ;
    setOverlappingFlags(intersections);
    removeNotRelevantChains(res_poly, op, intersections.int_points1_sorted, true);
    removeNotRelevantChains(wrk_poly, op, intersections.int_points2_sorted, false);
    removeNotRelevantNotIntersectedFaces(res_poly, notIntersectedFacesRes, op, true);
    removeNotRelevantNotIntersectedFaces(wrk_poly, notIntersectedFacesWrk, op, false);
  }
  function swapLinksAndRestore(res_poly, wrk_poly, intersections, op) {
    copyWrkToRes(res_poly, wrk_poly, op, intersections.int_points2);
    swapLinks(res_poly, wrk_poly, intersections);
    removeOldFaces(res_poly, intersections.int_points1);
    removeOldFaces(wrk_poly, intersections.int_points2);
    restoreFaces(res_poly, intersections.int_points1, intersections.int_points2);
    restoreFaces(res_poly, intersections.int_points2, intersections.int_points1);
  }
  function booleanOpBinary(polygon1, polygon2, op, restore) {
    let res_poly = polygon1.clone();
    let wrk_poly = polygon2.clone();
    let intersections = getIntersections(res_poly, wrk_poly);
    sortIntersections(intersections);
    splitByIntersections(res_poly, intersections.int_points1_sorted);
    splitByIntersections(wrk_poly, intersections.int_points2_sorted);
    filterDuplicatedIntersections(intersections);
    filterNotRelevantEdges(res_poly, wrk_poly, intersections, op);
    if (restore) {
      swapLinksAndRestore(res_poly, wrk_poly, intersections, op);
    }
    return [res_poly, wrk_poly];
  }
  function getIntersections(polygon1, polygon2) {
    let intersections = {
      int_points1: [],
      int_points2: []
    };
    for (let edge1 of polygon1.edges) {
      let resp = polygon2.edges.search(edge1.box);
      for (let edge2 of resp) {
        let ip = edge1.shape.intersect(edge2.shape);
        for (let pt of ip) {
          addToIntPoints(edge1, pt, intersections.int_points1);
          addToIntPoints(edge2, pt, intersections.int_points2);
        }
      }
    }
    return intersections;
  }
  function addToIntPoints(edge, pt, int_points) {
    let id = int_points.length;
    let shapes = edge.shape.split(pt);
    if (shapes.length === 0)
      return;
    let len = 0;
    if (shapes[0] === null) {
      len = 0;
    } else if (shapes[1] === null) {
      len = edge.shape.length;
    } else {
      len = shapes[0].length;
    }
    let is_vertex = NOT_VERTEX;
    if (EQ(len, 0)) {
      is_vertex |= START_VERTEX;
    }
    if (EQ(len, edge.shape.length)) {
      is_vertex |= END_VERTEX;
    }
    let arc_length = is_vertex & END_VERTEX && edge.next.arc_length === 0 ? 0 : edge.arc_length + len;
    int_points.push({
      id,
      pt,
      arc_length,
      edge_before: edge,
      edge_after: void 0,
      face: edge.face,
      is_vertex
    });
  }
  function sortIntersections(intersections) {
    intersections.int_points1_sorted = getSortedArray(intersections.int_points1);
    intersections.int_points2_sorted = getSortedArray(intersections.int_points2);
  }
  function getSortedArray(int_points) {
    let faceMap = new Map();
    let id = 0;
    for (let ip of int_points) {
      if (!faceMap.has(ip.face)) {
        faceMap.set(ip.face, id);
        id++;
      }
    }
    for (let ip of int_points) {
      ip.faceId = faceMap.get(ip.face);
    }
    let int_points_sorted = int_points.slice().sort(compareFn);
    return int_points_sorted;
  }
  function compareFn(ip1, ip2) {
    if (ip1.faceId < ip2.faceId) {
      return -1;
    }
    if (ip1.faceId > ip2.faceId) {
      return 1;
    }
    if (ip1.arc_length < ip2.arc_length) {
      return -1;
    }
    if (ip1.arc_length > ip2.arc_length) {
      return 1;
    }
    return 0;
  }
  function splitByIntersections(polygon2, int_points) {
    if (!int_points)
      return;
    for (let int_point of int_points) {
      let edge = int_point.edge_before;
      int_point.is_vertex = NOT_VERTEX;
      if (edge.shape.start.equalTo(int_point.pt)) {
        int_point.is_vertex |= START_VERTEX;
      }
      if (edge.shape.end.equalTo(int_point.pt)) {
        int_point.is_vertex |= END_VERTEX;
      }
      if (int_point.is_vertex & START_VERTEX) {
        int_point.edge_before = edge.prev;
        int_point.is_vertex = END_VERTEX;
        continue;
      }
      if (int_point.is_vertex & END_VERTEX) {
        continue;
      }
      let newEdge = polygon2.addVertex(int_point.pt, edge);
      int_point.edge_before = newEdge;
    }
    for (let int_point of int_points) {
      int_point.edge_after = int_point.edge_before.next;
    }
  }
  function filterDuplicatedIntersections(intersections) {
    if (intersections.int_points1.length < 2)
      return;
    let do_squeeze = false;
    let int_point_ref1;
    let int_point_ref2;
    let int_point_cur1;
    let int_point_cur2;
    for (let i = 0; i < intersections.int_points1_sorted.length; i++) {
      if (intersections.int_points1_sorted[i].id === -1)
        continue;
      int_point_ref1 = intersections.int_points1_sorted[i];
      int_point_ref2 = intersections.int_points2[int_point_ref1.id];
      for (let j = i + 1; j < intersections.int_points1_sorted.length; j++) {
        int_point_cur1 = intersections.int_points1_sorted[j];
        if (!EQ(int_point_cur1.arc_length, int_point_ref1.arc_length)) {
          break;
        }
        if (int_point_cur1.id === -1)
          continue;
        int_point_cur2 = intersections.int_points2[int_point_cur1.id];
        if (int_point_cur2.id === -1)
          continue;
        if (int_point_cur1.edge_before === int_point_ref1.edge_before && int_point_cur1.edge_after === int_point_ref1.edge_after && int_point_cur2.edge_before === int_point_ref2.edge_before && int_point_cur2.edge_after === int_point_ref2.edge_after) {
          int_point_cur1.id = -1;
          int_point_cur2.id = -1;
          do_squeeze = true;
        }
      }
    }
    int_point_ref2 = intersections.int_points2_sorted[0];
    int_point_ref1 = intersections.int_points1[int_point_ref2.id];
    for (let i = 1; i < intersections.int_points2_sorted.length; i++) {
      let int_point_cur22 = intersections.int_points2_sorted[i];
      if (int_point_cur22.id == -1)
        continue;
      if (int_point_ref2.id == -1 || !EQ(int_point_cur22.arc_length, int_point_ref2.arc_length)) {
        int_point_ref2 = int_point_cur22;
        int_point_ref1 = intersections.int_points1[int_point_ref2.id];
        continue;
      }
      let int_point_cur12 = intersections.int_points1[int_point_cur22.id];
      if (int_point_cur12.edge_before === int_point_ref1.edge_before && int_point_cur12.edge_after === int_point_ref1.edge_after && int_point_cur22.edge_before === int_point_ref2.edge_before && int_point_cur22.edge_after === int_point_ref2.edge_after) {
        int_point_cur12.id = -1;
        int_point_cur22.id = -1;
        do_squeeze = true;
      }
    }
    if (do_squeeze) {
      intersections.int_points1 = intersections.int_points1.filter((int_point) => int_point.id >= 0);
      intersections.int_points2 = intersections.int_points2.filter((int_point) => int_point.id >= 0);
      intersections.int_points1.forEach((int_point, index) => int_point.id = index);
      intersections.int_points2.forEach((int_point, index) => int_point.id = index);
      intersections.int_points1_sorted = [];
      intersections.int_points2_sorted = [];
      sortIntersections(intersections);
    }
  }
  function getNotIntersectedFaces(poly, int_points) {
    let notIntersected = [];
    for (let face of poly.faces) {
      if (!int_points.find((ip) => ip.face === face)) {
        notIntersected.push(face);
      }
    }
    return notIntersected;
  }
  function calcInclusionForNotIntersectedFaces(notIntersectedFaces, poly2) {
    for (let face of notIntersectedFaces) {
      face.first.bv = face.first.bvStart = face.first.bvEnd = void 0;
      face.first.setInclusion(poly2);
    }
  }
  function initializeInclusionFlags(int_points) {
    for (let int_point of int_points) {
      int_point.edge_before.bvStart = void 0;
      int_point.edge_before.bvEnd = void 0;
      int_point.edge_before.bv = void 0;
      int_point.edge_before.overlap = void 0;
      int_point.edge_after.bvStart = void 0;
      int_point.edge_after.bvEnd = void 0;
      int_point.edge_after.bv = void 0;
      int_point.edge_after.overlap = void 0;
    }
    for (let int_point of int_points) {
      int_point.edge_before.bvEnd = BOUNDARY$1;
      int_point.edge_after.bvStart = BOUNDARY$1;
    }
  }
  function calculateInclusionFlags(int_points, polygon2) {
    for (let int_point of int_points) {
      int_point.edge_before.setInclusion(polygon2);
      int_point.edge_after.setInclusion(polygon2);
    }
  }
  function fixBoundaryConflicts(poly1, poly2, int_points1, int_points1_sorted, int_points2, intersections) {
    let cur_face;
    let first_int_point_in_face_id;
    let next_int_point1;
    let num_int_points = int_points1_sorted.length;
    let iterate_more = false;
    for (let i = 0; i < num_int_points; i++) {
      let cur_int_point1 = int_points1_sorted[i];
      if (cur_int_point1.face !== cur_face) {
        first_int_point_in_face_id = i;
        cur_face = cur_int_point1.face;
      }
      let int_points_cur_pool_start = i;
      let int_points_cur_pool_num = intPointsPoolCount(int_points1_sorted, i, cur_face);
      let next_int_point_id;
      if (int_points_cur_pool_start + int_points_cur_pool_num < num_int_points && int_points1_sorted[int_points_cur_pool_start + int_points_cur_pool_num].face === cur_face) {
        next_int_point_id = int_points_cur_pool_start + int_points_cur_pool_num;
      } else {
        next_int_point_id = first_int_point_in_face_id;
      }
      let int_points_next_pool_num = intPointsPoolCount(int_points1_sorted, next_int_point_id, cur_face);
      next_int_point1 = null;
      for (let j = next_int_point_id; j < next_int_point_id + int_points_next_pool_num; j++) {
        let next_int_point1_tmp = int_points1_sorted[j];
        if (next_int_point1_tmp.face === cur_face && int_points2[next_int_point1_tmp.id].face === int_points2[cur_int_point1.id].face) {
          next_int_point1 = next_int_point1_tmp;
          break;
        }
      }
      if (next_int_point1 === null)
        continue;
      let edge_from1 = cur_int_point1.edge_after;
      let edge_to1 = next_int_point1.edge_before;
      if (edge_from1.bv === BOUNDARY$1 && edge_to1.bv != BOUNDARY$1) {
        edge_from1.bv = edge_to1.bv;
        continue;
      }
      if (edge_from1.bv != BOUNDARY$1 && edge_to1.bv === BOUNDARY$1) {
        edge_to1.bv = edge_from1.bv;
        continue;
      }
      if (edge_from1.bv === BOUNDARY$1 && edge_to1.bv === BOUNDARY$1 && edge_from1 != edge_to1 || (edge_from1.bv === INSIDE$1 && edge_to1.bv === OUTSIDE$1 || edge_from1.bv === OUTSIDE$1 && edge_to1.bv === INSIDE$1)) {
        let edge_tmp = edge_from1.next;
        while (edge_tmp != edge_to1) {
          edge_tmp.bvStart = void 0;
          edge_tmp.bvEnd = void 0;
          edge_tmp.bv = void 0;
          edge_tmp.setInclusion(poly2);
          edge_tmp = edge_tmp.next;
        }
      }
      if (edge_from1.bv === BOUNDARY$1 && edge_to1.bv === BOUNDARY$1 && edge_from1 != edge_to1) {
        let edge_tmp = edge_from1.next;
        let new_bv;
        while (edge_tmp != edge_to1) {
          if (edge_tmp.bv != BOUNDARY$1) {
            if (new_bv === void 0) {
              new_bv = edge_tmp.bv;
            } else {
              if (edge_tmp.bv != new_bv) {
                throw Flatten.Errors.UNRESOLVED_BOUNDARY_CONFLICT;
              }
            }
          }
          edge_tmp = edge_tmp.next;
        }
        if (new_bv != void 0) {
          edge_from1.bv = new_bv;
          edge_to1.bv = new_bv;
        }
        continue;
      }
      if (edge_from1.bv === INSIDE$1 && edge_to1.bv === OUTSIDE$1 || edge_from1.bv === OUTSIDE$1 && edge_to1.bv === INSIDE$1) {
        let edge_tmp = edge_from1;
        while (edge_tmp != edge_to1) {
          if (edge_tmp.bvStart === edge_from1.bv && edge_tmp.bvEnd === edge_to1.bv) {
            let [dist, segment2] = edge_tmp.shape.distanceTo(poly2);
            if (dist < 10 * Flatten.DP_TOL) {
              addToIntPoints(edge_tmp, segment2.ps, int_points1);
              let int_point1 = int_points1[int_points1.length - 1];
              if (int_point1.is_vertex & START_VERTEX) {
                int_point1.edge_after = edge_tmp;
                int_point1.edge_before = edge_tmp.prev;
                edge_tmp.bvStart = BOUNDARY$1;
                edge_tmp.bv = void 0;
                edge_tmp.setInclusion(poly2);
              } else if (int_point1.is_vertex & END_VERTEX) {
                int_point1.edge_after = edge_tmp.next;
                edge_tmp.bvEnd = BOUNDARY$1;
                edge_tmp.bv = void 0;
                edge_tmp.setInclusion(poly2);
              } else {
                let newEdge1 = poly2.addVertex(int_point1.pt, edge_tmp);
                int_point1.edge_before = newEdge1;
                int_point1.edge_after = newEdge1.next;
                newEdge1.setInclusion(poly2);
                newEdge1.next.bvStart = BOUNDARY$1;
                newEdge1.next.bvEnd = void 0;
                newEdge1.next.bv = void 0;
                newEdge1.next.setInclusion(poly2);
              }
              let edge2 = poly2.findEdgeByPoint(segment2.pe);
              addToIntPoints(edge2, segment2.pe, int_points2);
              let int_point2 = int_points2[int_points2.length - 1];
              if (int_point2.is_vertex & START_VERTEX) {
                int_point2.edge_after = edge2;
                int_point2.edge_before = edge2.prev;
              } else if (int_point2.is_vertex & END_VERTEX) {
                int_point2.edge_after = edge2.next;
              } else {
                let int_point2_edge_after = int_points2.find((int_point) => int_point.edge_after === edge2);
                let newEdge2 = poly2.addVertex(int_point2.pt, edge2);
                int_point2.edge_before = newEdge2;
                int_point2.edge_after = newEdge2.next;
                if (int_point2_edge_after)
                  int_point2_edge_after.edge_after = newEdge2;
                newEdge2.bvStart = void 0;
                newEdge2.bvEnd = BOUNDARY$1;
                newEdge2.bv = void 0;
                newEdge2.setInclusion(poly1);
                newEdge2.next.bvStart = BOUNDARY$1;
                newEdge2.next.bvEnd = void 0;
                newEdge2.next.bv = void 0;
                newEdge2.next.setInclusion(poly1);
              }
              sortIntersections(intersections);
              iterate_more = true;
              break;
            }
          }
          edge_tmp = edge_tmp.next;
        }
        if (iterate_more)
          break;
        throw Flatten.Errors.UNRESOLVED_BOUNDARY_CONFLICT;
      }
    }
    return iterate_more;
  }
  function setOverlappingFlags(intersections) {
    let cur_face = void 0;
    let first_int_point_in_face_id = void 0;
    let next_int_point1 = void 0;
    let num_int_points = intersections.int_points1.length;
    for (let i = 0; i < num_int_points; i++) {
      let cur_int_point1 = intersections.int_points1_sorted[i];
      if (cur_int_point1.face !== cur_face) {
        first_int_point_in_face_id = i;
        cur_face = cur_int_point1.face;
      }
      let int_points_cur_pool_start = i;
      let int_points_cur_pool_num = intPointsPoolCount(intersections.int_points1_sorted, i, cur_face);
      let next_int_point_id;
      if (int_points_cur_pool_start + int_points_cur_pool_num < num_int_points && intersections.int_points1_sorted[int_points_cur_pool_start + int_points_cur_pool_num].face === cur_face) {
        next_int_point_id = int_points_cur_pool_start + int_points_cur_pool_num;
      } else {
        next_int_point_id = first_int_point_in_face_id;
      }
      let int_points_next_pool_num = intPointsPoolCount(intersections.int_points1_sorted, next_int_point_id, cur_face);
      next_int_point1 = null;
      for (let j = next_int_point_id; j < next_int_point_id + int_points_next_pool_num; j++) {
        let next_int_point1_tmp = intersections.int_points1_sorted[j];
        if (next_int_point1_tmp.face === cur_face && intersections.int_points2[next_int_point1_tmp.id].face === intersections.int_points2[cur_int_point1.id].face) {
          next_int_point1 = next_int_point1_tmp;
          break;
        }
      }
      if (next_int_point1 === null)
        continue;
      let edge_from1 = cur_int_point1.edge_after;
      let edge_to1 = next_int_point1.edge_before;
      if (!(edge_from1.bv === BOUNDARY$1 && edge_to1.bv === BOUNDARY$1))
        continue;
      if (edge_from1 !== edge_to1)
        continue;
      let cur_int_point2 = intersections.int_points2[cur_int_point1.id];
      let next_int_point2 = intersections.int_points2[next_int_point1.id];
      let edge_from2 = cur_int_point2.edge_after;
      let edge_to2 = next_int_point2.edge_before;
      if (!(edge_from2.bv === BOUNDARY$1 && edge_to2.bv === BOUNDARY$1 && edge_from2 === edge_to2)) {
        cur_int_point2 = intersections.int_points2[next_int_point1.id];
        next_int_point2 = intersections.int_points2[cur_int_point1.id];
        edge_from2 = cur_int_point2.edge_after;
        edge_to2 = next_int_point2.edge_before;
      }
      if (!(edge_from2.bv === BOUNDARY$1 && edge_to2.bv === BOUNDARY$1 && edge_from2 === edge_to2))
        continue;
      edge_from1.setOverlap(edge_from2);
    }
  }
  function removeNotRelevantChains(polygon2, op, int_points, is_res_polygon) {
    if (!int_points)
      return;
    let cur_face = void 0;
    let first_int_point_in_face_num = void 0;
    let int_point_current;
    let int_point_next;
    for (let i = 0; i < int_points.length; i++) {
      int_point_current = int_points[i];
      if (int_point_current.face !== cur_face) {
        first_int_point_in_face_num = i;
        cur_face = int_point_current.face;
      }
      if (cur_face.isEmpty())
        continue;
      let int_points_from_pull_start = i;
      let int_points_from_pull_num = intPointsPoolCount(int_points, i, cur_face);
      let next_int_point_num;
      if (int_points_from_pull_start + int_points_from_pull_num < int_points.length && int_points[int_points_from_pull_start + int_points_from_pull_num].face === int_point_current.face) {
        next_int_point_num = int_points_from_pull_start + int_points_from_pull_num;
      } else {
        next_int_point_num = first_int_point_in_face_num;
      }
      int_point_next = int_points[next_int_point_num];
      let int_points_to_pull_start = next_int_point_num;
      let int_points_to_pull_num = intPointsPoolCount(int_points, int_points_to_pull_start, cur_face);
      let edge_from = int_point_current.edge_after;
      let edge_to = int_point_next.edge_before;
      if (edge_from.bv === INSIDE$1 && edge_to.bv === INSIDE$1 && op === BOOLEAN_UNION || edge_from.bv === OUTSIDE$1 && edge_to.bv === OUTSIDE$1 && op === BOOLEAN_INTERSECT || (edge_from.bv === OUTSIDE$1 || edge_to.bv === OUTSIDE$1) && op === BOOLEAN_SUBTRACT && !is_res_polygon || (edge_from.bv === INSIDE$1 || edge_to.bv === INSIDE$1) && op === BOOLEAN_SUBTRACT && is_res_polygon || edge_from.bv === BOUNDARY$1 && edge_to.bv === BOUNDARY$1 && edge_from.overlap & OVERLAP_SAME$1 && is_res_polygon || edge_from.bv === BOUNDARY$1 && edge_to.bv === BOUNDARY$1 && edge_from.overlap & OVERLAP_OPPOSITE$1) {
        polygon2.removeChain(cur_face, edge_from, edge_to);
        for (let k = int_points_from_pull_start; k < int_points_from_pull_start + int_points_from_pull_num; k++) {
          int_points[k].edge_after = void 0;
        }
        for (let k = int_points_to_pull_start; k < int_points_to_pull_start + int_points_to_pull_num; k++) {
          int_points[k].edge_before = void 0;
        }
      }
      i += int_points_from_pull_num - 1;
    }
  }
  function intPointsPoolCount(int_points, cur_int_point_num, cur_face) {
    let int_point_current;
    let int_point_next;
    let int_points_pool_num = 1;
    if (int_points.length == 1)
      return 1;
    int_point_current = int_points[cur_int_point_num];
    for (let i = cur_int_point_num + 1; i < int_points.length; i++) {
      if (int_point_current.face != cur_face) {
        break;
      }
      int_point_next = int_points[i];
      if (!(int_point_next.pt.equalTo(int_point_current.pt) && int_point_next.edge_before === int_point_current.edge_before && int_point_next.edge_after === int_point_current.edge_after)) {
        break;
      }
      int_points_pool_num++;
    }
    return int_points_pool_num;
  }
  function copyWrkToRes(res_polygon, wrk_polygon, op, int_points) {
    for (let face of wrk_polygon.faces) {
      for (let edge of face) {
        res_polygon.edges.add(edge);
      }
      if (int_points.find((ip) => ip.face === face) === void 0) {
        res_polygon.addFace(face.first, face.last);
      }
    }
  }
  function swapLinks(res_polygon, wrk_polygon, intersections) {
    if (intersections.int_points1.length === 0)
      return;
    for (let i = 0; i < intersections.int_points1.length; i++) {
      let int_point1 = intersections.int_points1[i];
      let int_point2 = intersections.int_points2[i];
      if (int_point1.edge_before !== void 0 && int_point1.edge_after === void 0) {
        if (int_point2.edge_before === void 0 && int_point2.edge_after !== void 0) {
          int_point1.edge_before.next = int_point2.edge_after;
          int_point2.edge_after.prev = int_point1.edge_before;
          int_point1.edge_after = int_point2.edge_after;
          int_point2.edge_before = int_point1.edge_before;
        }
      }
      if (int_point2.edge_before !== void 0 && int_point2.edge_after === void 0) {
        if (int_point1.edge_before === void 0 && int_point1.edge_after !== void 0) {
          int_point2.edge_before.next = int_point1.edge_after;
          int_point1.edge_after.prev = int_point2.edge_before;
          int_point2.edge_after = int_point1.edge_after;
          int_point1.edge_before = int_point2.edge_before;
        }
      }
      if (int_point1.edge_before !== void 0 && int_point1.edge_after === void 0) {
        for (let int_point of intersections.int_points1_sorted) {
          if (int_point === int_point1)
            continue;
          if (int_point.edge_before === void 0 && int_point.edge_after !== void 0) {
            if (int_point.pt.equalTo(int_point1.pt)) {
              int_point1.edge_before.next = int_point.edge_after;
              int_point.edge_after.prev = int_point1.edge_before;
              int_point1.edge_after = int_point.edge_after;
              int_point.edge_before = int_point1.edge_before;
            }
          }
        }
      }
      if (int_point2.edge_before !== void 0 && int_point2.edge_after === void 0) {
        for (let int_point of intersections.int_points2_sorted) {
          if (int_point === int_point2)
            continue;
          if (int_point.edge_before === void 0 && int_point.edge_after !== void 0) {
            if (int_point.pt.equalTo(int_point2.pt)) {
              int_point2.edge_before.next = int_point.edge_after;
              int_point.edge_after.prev = int_point2.edge_before;
              int_point2.edge_after = int_point.edge_after;
              int_point.edge_before = int_point2.edge_before;
            }
          }
        }
      }
    }
  }
  function removeOldFaces(polygon2, int_points) {
    for (let int_point of int_points) {
      polygon2.faces.delete(int_point.face);
      int_point.face = void 0;
      if (int_point.edge_before)
        int_point.edge_before.face = void 0;
      if (int_point.edge_after)
        int_point.edge_after.face = void 0;
    }
  }
  function restoreFaces(polygon2, int_points, other_int_points) {
    for (let int_point of int_points) {
      if (int_point.edge_before === void 0 || int_point.edge_after === void 0)
        continue;
      if (int_point.face)
        continue;
      if (int_point.edge_after.face || int_point.edge_before.face)
        continue;
      let first = int_point.edge_after;
      let last = int_point.edge_before;
      LinkedList.testInfiniteLoop(first);
      let face = polygon2.addFace(first, last);
      for (let int_point_tmp of int_points) {
        if (int_point_tmp.edge_before && int_point_tmp.edge_after && int_point_tmp.edge_before.face === face && int_point_tmp.edge_after.face === face) {
          int_point_tmp.face = face;
        }
      }
      for (let int_point_tmp of other_int_points) {
        if (int_point_tmp.edge_before && int_point_tmp.edge_after && int_point_tmp.edge_before.face === face && int_point_tmp.edge_after.face === face) {
          int_point_tmp.face = face;
        }
      }
    }
  }
  function removeNotRelevantNotIntersectedFaces(polygon2, notIntersectedFaces, op, is_res_polygon) {
    for (let face of notIntersectedFaces) {
      let rel = face.first.bv;
      if (op === BOOLEAN_UNION && rel === INSIDE$1 || op === BOOLEAN_SUBTRACT && rel === INSIDE$1 && is_res_polygon || op === BOOLEAN_SUBTRACT && rel === OUTSIDE$1 && !is_res_polygon || op === BOOLEAN_INTERSECT && rel === OUTSIDE$1) {
        polygon2.deleteFace(face);
      }
    }
  }
  var BooleanOperations = /* @__PURE__ */ Object.freeze({
    BOOLEAN_UNION,
    BOOLEAN_INTERSECT,
    BOOLEAN_SUBTRACT,
    unify,
    subtract,
    intersect,
    innerClip,
    outerClip,
    calculateIntersections,
    addToIntPoints,
    getSortedArray,
    splitByIntersections,
    filterDuplicatedIntersections,
    removeNotRelevantChains,
    removeOldFaces,
    restoreFaces
  });
  var EQUAL = RegExp("T.F..FFF.|T.F...F..");
  var INTERSECT = RegExp("T........|.T.......|...T.....|....T....");
  var TOUCH = RegExp("FT.......|F..T.....|F...T....");
  var INSIDE$2 = RegExp("T.F..F...");
  var COVERED = RegExp("T.F..F...|.TF..F...|..FT.F...|..F.TF...");
  var DE9IM = class {
    constructor() {
      this.m = new Array(9).fill(void 0);
    }
    get I2I() {
      return this.m[0];
    }
    set I2I(geom) {
      this.m[0] = geom;
    }
    get I2B() {
      return this.m[1];
    }
    set I2B(geom) {
      this.m[1] = geom;
    }
    get I2E() {
      return this.m[2];
    }
    set I2E(geom) {
      this.m[2] = geom;
    }
    get B2I() {
      return this.m[3];
    }
    set B2I(geom) {
      this.m[3] = geom;
    }
    get B2B() {
      return this.m[4];
    }
    set B2B(geom) {
      this.m[4] = geom;
    }
    get B2E() {
      return this.m[5];
    }
    set B2E(geom) {
      this.m[5] = geom;
    }
    get E2I() {
      return this.m[6];
    }
    set E2I(geom) {
      this.m[6] = geom;
    }
    get E2B() {
      return this.m[7];
    }
    set E2B(geom) {
      this.m[7] = geom;
    }
    get E2E() {
      return this.m[8];
    }
    set E2E(geom) {
      this.m[8] = geom;
    }
    toString() {
      return this.m.map((e) => {
        if (e instanceof Array && e.length > 0) {
          return "T";
        } else if (e instanceof Array && e.length === 0) {
          return "F";
        } else {
          return "*";
        }
      }).join("");
    }
    equal() {
      return EQUAL.test(this.toString());
    }
    intersect() {
      return INTERSECT.test(this.toString());
    }
    touch() {
      return TOUCH.test(this.toString());
    }
    inside() {
      return INSIDE$2.test(this.toString());
    }
    covered() {
      return COVERED.test(this.toString());
    }
  };
  function intersectLine2Line(line1, line2) {
    let ip = [];
    let [A1, B1, C1] = line1.standard;
    let [A2, B2, C2] = line2.standard;
    let det = A1 * B2 - B1 * A2;
    let detX = C1 * B2 - B1 * C2;
    let detY = A1 * C2 - C1 * A2;
    if (!Flatten.Utils.EQ_0(det)) {
      let x, y;
      if (B1 === 0) {
        x = C1 / A1;
        y = detY / det;
      } else if (B2 === 0) {
        x = C2 / A2;
        y = detY / det;
      } else if (A1 === 0) {
        x = detX / det;
        y = C1 / B1;
      } else if (A2 === 0) {
        x = detX / det;
        y = C2 / B2;
      } else {
        x = detX / det;
        y = detY / det;
      }
      ip.push(new Flatten.Point(x, y));
    }
    return ip;
  }
  function intersectLine2Circle(line2, circle2) {
    let ip = [];
    let prj = circle2.pc.projectionOn(line2);
    let dist = circle2.pc.distanceTo(prj)[0];
    if (Flatten.Utils.EQ(dist, circle2.r)) {
      ip.push(prj);
    } else if (Flatten.Utils.LT(dist, circle2.r)) {
      let delta = Math.sqrt(circle2.r * circle2.r - dist * dist);
      let v_trans, pt;
      v_trans = line2.norm.rotate90CCW().multiply(delta);
      pt = prj.translate(v_trans);
      ip.push(pt);
      v_trans = line2.norm.rotate90CW().multiply(delta);
      pt = prj.translate(v_trans);
      ip.push(pt);
    }
    return ip;
  }
  function intersectLine2Box(line2, box2) {
    let ips = [];
    for (let seg of box2.toSegments()) {
      let ips_tmp = intersectSegment2Line(seg, line2);
      for (let pt of ips_tmp) {
        if (!ptInIntPoints(pt, ips)) {
          ips.push(pt);
        }
      }
    }
    return ips;
  }
  function intersectLine2Arc(line2, arc2) {
    let ip = [];
    if (intersectLine2Box(line2, arc2.box).length === 0) {
      return ip;
    }
    let circle2 = new Flatten.Circle(arc2.pc, arc2.r);
    let ip_tmp = intersectLine2Circle(line2, circle2);
    for (let pt of ip_tmp) {
      if (pt.on(arc2)) {
        ip.push(pt);
      }
    }
    return ip;
  }
  function intersectSegment2Line(seg, line2) {
    let ip = [];
    if (seg.ps.on(line2)) {
      ip.push(seg.ps);
    }
    if (seg.pe.on(line2) && !seg.isZeroLength()) {
      ip.push(seg.pe);
    }
    if (ip.length > 0) {
      return ip;
    }
    if (seg.isZeroLength()) {
      return ip;
    }
    if (seg.ps.leftTo(line2) && seg.pe.leftTo(line2) || !seg.ps.leftTo(line2) && !seg.pe.leftTo(line2)) {
      return ip;
    }
    let line1 = new Flatten.Line(seg.ps, seg.pe);
    return intersectLine2Line(line1, line2);
  }
  function intersectSegment2Segment(seg1, seg2) {
    let ip = [];
    if (seg1.box.not_intersect(seg2.box)) {
      return ip;
    }
    if (seg1.isZeroLength()) {
      if (seg1.ps.on(seg2)) {
        ip.push(seg1.ps);
      }
      return ip;
    }
    if (seg2.isZeroLength()) {
      if (seg2.ps.on(seg1)) {
        ip.push(seg2.ps);
      }
      return ip;
    }
    let line1 = new Flatten.Line(seg1.ps, seg1.pe);
    let line2 = new Flatten.Line(seg2.ps, seg2.pe);
    if (line1.incidentTo(line2)) {
      if (seg1.ps.on(seg2)) {
        ip.push(seg1.ps);
      }
      if (seg1.pe.on(seg2)) {
        ip.push(seg1.pe);
      }
      if (seg2.ps.on(seg1) && !seg2.ps.equalTo(seg1.ps) && !seg2.ps.equalTo(seg1.pe)) {
        ip.push(seg2.ps);
      }
      if (seg2.pe.on(seg1) && !seg2.pe.equalTo(seg1.ps) && !seg2.pe.equalTo(seg1.pe)) {
        ip.push(seg2.pe);
      }
    } else {
      let new_ip = intersectLine2Line(line1, line2);
      if (new_ip.length > 0 && new_ip[0].on(seg1) && new_ip[0].on(seg2)) {
        ip.push(new_ip[0]);
      }
    }
    return ip;
  }
  function intersectSegment2Circle(segment2, circle2) {
    let ips = [];
    if (segment2.box.not_intersect(circle2.box)) {
      return ips;
    }
    if (segment2.isZeroLength()) {
      let [dist, shortest_segment] = segment2.ps.distanceTo(circle2.pc);
      if (Flatten.Utils.EQ(dist, circle2.r)) {
        ips.push(segment2.ps);
      }
      return ips;
    }
    let line2 = new Flatten.Line(segment2.ps, segment2.pe);
    let ips_tmp = intersectLine2Circle(line2, circle2);
    for (let ip of ips_tmp) {
      if (ip.on(segment2)) {
        ips.push(ip);
      }
    }
    return ips;
  }
  function intersectSegment2Arc(segment2, arc2) {
    let ip = [];
    if (segment2.box.not_intersect(arc2.box)) {
      return ip;
    }
    if (segment2.isZeroLength()) {
      if (segment2.ps.on(arc2)) {
        ip.push(segment2.ps);
      }
      return ip;
    }
    let line2 = new Flatten.Line(segment2.ps, segment2.pe);
    let circle2 = new Flatten.Circle(arc2.pc, arc2.r);
    let ip_tmp = intersectLine2Circle(line2, circle2);
    for (let pt of ip_tmp) {
      if (pt.on(segment2) && pt.on(arc2)) {
        ip.push(pt);
      }
    }
    return ip;
  }
  function intersectSegment2Box(segment2, box2) {
    let ips = [];
    for (let seg of box2.toSegments()) {
      let ips_tmp = intersectSegment2Segment(seg, segment2);
      for (let ip of ips_tmp) {
        ips.push(ip);
      }
    }
    return ips;
  }
  function intersectCircle2Circle(circle1, circle2) {
    let ip = [];
    if (circle1.box.not_intersect(circle2.box)) {
      return ip;
    }
    let vec = new Flatten.Vector(circle1.pc, circle2.pc);
    let r1 = circle1.r;
    let r2 = circle2.r;
    if (Flatten.Utils.EQ_0(r1) || Flatten.Utils.EQ_0(r2))
      return ip;
    if (Flatten.Utils.EQ_0(vec.x) && Flatten.Utils.EQ_0(vec.y) && Flatten.Utils.EQ(r1, r2)) {
      ip.push(circle1.pc.translate(-r1, 0));
      return ip;
    }
    let dist = circle1.pc.distanceTo(circle2.pc)[0];
    if (Flatten.Utils.GT(dist, r1 + r2))
      return ip;
    if (Flatten.Utils.LT(dist, Math.abs(r1 - r2)))
      return ip;
    vec.x /= dist;
    vec.y /= dist;
    let pt;
    if (Flatten.Utils.EQ(dist, r1 + r2) || Flatten.Utils.EQ(dist, Math.abs(r1 - r2))) {
      pt = circle1.pc.translate(r1 * vec.x, r1 * vec.y);
      ip.push(pt);
      return ip;
    }
    let a = r1 * r1 / (2 * dist) - r2 * r2 / (2 * dist) + dist / 2;
    let mid_pt = circle1.pc.translate(a * vec.x, a * vec.y);
    let h = Math.sqrt(r1 * r1 - a * a);
    pt = mid_pt.translate(vec.rotate90CCW().multiply(h));
    ip.push(pt);
    pt = mid_pt.translate(vec.rotate90CW().multiply(h));
    ip.push(pt);
    return ip;
  }
  function intersectCircle2Box(circle2, box2) {
    let ips = [];
    for (let seg of box2.toSegments()) {
      let ips_tmp = intersectSegment2Circle(seg, circle2);
      for (let ip of ips_tmp) {
        ips.push(ip);
      }
    }
    return ips;
  }
  function intersectArc2Arc(arc1, arc2) {
    var ip = [];
    if (arc1.box.not_intersect(arc2.box)) {
      return ip;
    }
    if (arc1.pc.equalTo(arc2.pc) && Flatten.Utils.EQ(arc1.r, arc2.r)) {
      let pt;
      pt = arc1.start;
      if (pt.on(arc2))
        ip.push(pt);
      pt = arc1.end;
      if (pt.on(arc2))
        ip.push(pt);
      pt = arc2.start;
      if (pt.on(arc1))
        ip.push(pt);
      pt = arc2.end;
      if (pt.on(arc1))
        ip.push(pt);
      return ip;
    }
    let circle1 = new Flatten.Circle(arc1.pc, arc1.r);
    let circle2 = new Flatten.Circle(arc2.pc, arc2.r);
    let ip_tmp = circle1.intersect(circle2);
    for (let pt of ip_tmp) {
      if (pt.on(arc1) && pt.on(arc2)) {
        ip.push(pt);
      }
    }
    return ip;
  }
  function intersectArc2Circle(arc2, circle2) {
    let ip = [];
    if (arc2.box.not_intersect(circle2.box)) {
      return ip;
    }
    if (circle2.pc.equalTo(arc2.pc) && Flatten.Utils.EQ(circle2.r, arc2.r)) {
      ip.push(arc2.start);
      ip.push(arc2.end);
      return ip;
    }
    let circle1 = circle2;
    let circle22 = new Flatten.Circle(arc2.pc, arc2.r);
    let ip_tmp = intersectCircle2Circle(circle1, circle22);
    for (let pt of ip_tmp) {
      if (pt.on(arc2)) {
        ip.push(pt);
      }
    }
    return ip;
  }
  function intersectArc2Box(arc2, box2) {
    let ips = [];
    for (let seg of box2.toSegments()) {
      let ips_tmp = intersectSegment2Arc(seg, arc2);
      for (let ip of ips_tmp) {
        ips.push(ip);
      }
    }
    return ips;
  }
  function intersectEdge2Segment(edge, segment2) {
    return edge.isSegment() ? intersectSegment2Segment(edge.shape, segment2) : intersectSegment2Arc(segment2, edge.shape);
  }
  function intersectEdge2Arc(edge, arc2) {
    return edge.isSegment() ? intersectSegment2Arc(edge.shape, arc2) : intersectArc2Arc(edge.shape, arc2);
  }
  function intersectEdge2Line(edge, line2) {
    return edge.isSegment() ? intersectSegment2Line(edge.shape, line2) : intersectLine2Arc(line2, edge.shape);
  }
  function intersectEdge2Circle(edge, circle2) {
    return edge.isSegment() ? intersectSegment2Circle(edge.shape, circle2) : intersectArc2Circle(edge.shape, circle2);
  }
  function intersectSegment2Polygon(segment2, polygon2) {
    let ip = [];
    for (let edge of polygon2.edges) {
      for (let pt of intersectEdge2Segment(edge, segment2)) {
        ip.push(pt);
      }
    }
    return ip;
  }
  function intersectArc2Polygon(arc2, polygon2) {
    let ip = [];
    for (let edge of polygon2.edges) {
      for (let pt of intersectEdge2Arc(edge, arc2)) {
        ip.push(pt);
      }
    }
    return ip;
  }
  function intersectLine2Polygon(line2, polygon2) {
    let ip = [];
    if (polygon2.isEmpty()) {
      return ip;
    }
    for (let edge of polygon2.edges) {
      for (let pt of intersectEdge2Line(edge, line2)) {
        if (!ptInIntPoints(pt, ip)) {
          ip.push(pt);
        }
      }
    }
    return line2.sortPoints(ip);
  }
  function intersectCircle2Polygon(circle2, polygon2) {
    let ip = [];
    if (polygon2.isEmpty()) {
      return ip;
    }
    for (let edge of polygon2.edges) {
      for (let pt of intersectEdge2Circle(edge, circle2)) {
        ip.push(pt);
      }
    }
    return ip;
  }
  function intersectEdge2Edge(edge1, edge2) {
    const shape1 = edge1.shape;
    const shape2 = edge2.shape;
    return edge1.isSegment() ? edge2.isSegment() ? intersectSegment2Segment(shape1, shape2) : intersectSegment2Arc(shape1, shape2) : edge2.isSegment() ? intersectSegment2Arc(shape2, shape1) : intersectArc2Arc(shape1, shape2);
  }
  function intersectEdge2Polygon(edge, polygon2) {
    let ip = [];
    if (polygon2.isEmpty() || edge.shape.box.not_intersect(polygon2.box)) {
      return ip;
    }
    let resp_edges = polygon2.edges.search(edge.shape.box);
    for (let resp_edge of resp_edges) {
      for (let pt of intersectEdge2Edge(edge, resp_edge)) {
        ip.push(pt);
      }
    }
    return ip;
  }
  function intersectPolygon2Polygon(polygon1, polygon2) {
    let ip = [];
    if (polygon1.isEmpty() || polygon2.isEmpty()) {
      return ip;
    }
    if (polygon1.box.not_intersect(polygon2.box)) {
      return ip;
    }
    for (let edge1 of polygon1.edges) {
      for (let pt of intersectEdge2Polygon(edge1, polygon2)) {
        ip.push(pt);
      }
    }
    return ip;
  }
  function intersectShape2Polygon(shape, polygon2) {
    if (shape instanceof Flatten.Line) {
      return intersectLine2Polygon(shape, polygon2);
    } else if (shape instanceof Flatten.Segment) {
      return intersectSegment2Polygon(shape, polygon2);
    } else if (shape instanceof Flatten.Arc) {
      return intersectArc2Polygon(shape, polygon2);
    } else {
      return [];
    }
  }
  function ptInIntPoints(new_pt, ip) {
    return ip.some((pt) => pt.equalTo(new_pt));
  }
  var Multiline = class extends LinkedList {
    constructor(...args) {
      super();
      if (args.length === 0) {
        return;
      }
      if (args.length == 1) {
        if (args[0] instanceof Array) {
          let shapes = args[0];
          if (shapes.length == 0)
            return;
          let validShapes = shapes.every((shape) => {
            return shape instanceof Flatten.Segment || shape instanceof Flatten.Arc || shape instanceof Flatten.Ray || shape instanceof Flatten.Line;
          });
          for (let shape of shapes) {
            let edge = new Flatten.Edge(shape);
            this.append(edge);
          }
        }
      }
    }
    get edges() {
      return [...this];
    }
    get box() {
      return this.edges.reduce((acc, edge) => acc = acc.merge(edge.box), new Flatten.Box());
    }
    get vertices() {
      let v = this.edges.map((edge) => edge.start);
      v.push(this.last.end);
      return v;
    }
    clone() {
      return new Multiline(this.toShapes());
    }
    addVertex(pt, edge) {
      let shapes = edge.shape.split(pt);
      if (shapes[0] === null)
        return edge.prev;
      if (shapes[1] === null)
        return edge;
      let newEdge = new Flatten.Edge(shapes[0]);
      let edgeBefore = edge.prev;
      this.insert(newEdge, edgeBefore);
      edge.shape = shapes[1];
      return newEdge;
    }
    split(ip) {
      for (let pt of ip) {
        let edge = this.findEdgeByPoint(pt);
        this.addVertex(pt, edge);
      }
      return this;
    }
    findEdgeByPoint(pt) {
      let edgeFound;
      for (let edge of this) {
        if (edge.shape.contains(pt)) {
          edgeFound = edge;
          break;
        }
      }
      return edgeFound;
    }
    translate(vec) {
      return new Multiline(this.edges.map((edge) => edge.shape.translate(vec)));
    }
    rotate(angle = 0, center = new Flatten.Point()) {
      return new Multiline(this.edges.map((edge) => edge.shape.rotate(angle, center)));
    }
    transform(matrix2 = new Flatten.Matrix()) {
      return new Multiline(this.edges.map((edge) => edge.shape.transform(matrix2)));
    }
    toShapes() {
      return this.edges.map((edge) => edge.shape.clone());
    }
    toJSON() {
      return this.edges.map((edge) => edge.toJSON());
    }
    svg(attrs = {}) {
      let { stroke, strokeWidth, fill, fillRule, fillOpacity, id, className } = attrs;
      let id_str = id && id.length > 0 ? `id="${id}"` : "";
      let class_str = className && className.length > 0 ? `class="${className}"` : "";
      let svgStr = `
<path stroke="${stroke || "black"}" stroke-width="${strokeWidth || 1}" fill="${fill || "none"}" fill-opacity="${fillOpacity || 1}" ${id_str} ${class_str} d="`;
      svgStr += `
M${this.first.start.x},${this.first.start.y}`;
      for (let edge of this) {
        svgStr += edge.svg();
      }
      svgStr += `" >
</path>`;
      return svgStr;
    }
  };
  Flatten.Multiline = Multiline;
  var multiline = (...args) => new Flatten.Multiline(...args);
  Flatten.multiline = multiline;
  function ray_shoot(polygon2, point2) {
    let contains = void 0;
    let ray2 = new Flatten.Ray(point2);
    let line2 = new Flatten.Line(ray2.pt, ray2.norm);
    const searchBox = new Flatten.Box(ray2.box.xmin - Flatten.DP_TOL, ray2.box.ymin - Flatten.DP_TOL, ray2.box.xmax, ray2.box.ymax + Flatten.DP_TOL);
    if (polygon2.box.not_intersect(searchBox)) {
      return Flatten.OUTSIDE;
    }
    let resp_edges = polygon2.edges.search(searchBox);
    if (resp_edges.length == 0) {
      return Flatten.OUTSIDE;
    }
    for (let edge of resp_edges) {
      if (edge.shape.contains(point2)) {
        return Flatten.BOUNDARY;
      }
    }
    let intersections = [];
    for (let edge of resp_edges) {
      for (let ip of ray2.intersect(edge.shape)) {
        if (ip.equalTo(point2)) {
          return Flatten.BOUNDARY;
        }
        intersections.push({
          pt: ip,
          edge
        });
      }
    }
    intersections.sort((i1, i2) => {
      if (LT(i1.pt.x, i2.pt.x)) {
        return -1;
      }
      if (GT(i1.pt.x, i2.pt.x)) {
        return 1;
      }
      return 0;
    });
    let counter = 0;
    for (let i = 0; i < intersections.length; i++) {
      let intersection = intersections[i];
      if (intersection.pt.equalTo(intersection.edge.shape.start)) {
        if (i > 0 && intersection.pt.equalTo(intersections[i - 1].pt) && intersection.edge.prev === intersections[i - 1].edge) {
          continue;
        }
        let prev_edge = intersection.edge.prev;
        while (EQ_0(prev_edge.length)) {
          prev_edge = prev_edge.prev;
        }
        let prev_tangent = prev_edge.shape.tangentInEnd();
        let prev_point = intersection.pt.translate(prev_tangent);
        let cur_tangent = intersection.edge.shape.tangentInStart();
        let cur_point = intersection.pt.translate(cur_tangent);
        let prev_on_the_left = prev_point.leftTo(line2);
        let cur_on_the_left = cur_point.leftTo(line2);
        if (prev_on_the_left && !cur_on_the_left || !prev_on_the_left && cur_on_the_left) {
          counter++;
        }
      } else if (intersection.pt.equalTo(intersection.edge.shape.end)) {
        if (i > 0 && intersection.pt.equalTo(intersections[i - 1].pt) && intersection.edge.next === intersections[i - 1].edge) {
          continue;
        }
        let next_edge = intersection.edge.next;
        while (EQ_0(next_edge.length)) {
          next_edge = next_edge.next;
        }
        let next_tangent = next_edge.shape.tangentInStart();
        let next_point = intersection.pt.translate(next_tangent);
        let cur_tangent = intersection.edge.shape.tangentInEnd();
        let cur_point = intersection.pt.translate(cur_tangent);
        let next_on_the_left = next_point.leftTo(line2);
        let cur_on_the_left = cur_point.leftTo(line2);
        if (next_on_the_left && !cur_on_the_left || !next_on_the_left && cur_on_the_left) {
          counter++;
        }
      } else {
        if (intersection.edge.shape instanceof Flatten.Segment) {
          counter++;
        } else {
          let box2 = intersection.edge.shape.box;
          if (!(EQ(intersection.pt.y, box2.ymin) || EQ(intersection.pt.y, box2.ymax))) {
            counter++;
          }
        }
      }
    }
    contains = counter % 2 == 1 ? Flatten.INSIDE : Flatten.OUTSIDE;
    return contains;
  }
  function equal(shape1, shape2) {
    return relate(shape1, shape2).equal();
  }
  function intersect$1(shape1, shape2) {
    return relate(shape1, shape2).intersect();
  }
  function touch(shape1, shape2) {
    return relate(shape1, shape2).touch();
  }
  function disjoint(shape1, shape2) {
    return !intersect$1(shape1, shape2);
  }
  function inside(shape1, shape2) {
    return relate(shape1, shape2).inside();
  }
  function covered(shape1, shape2) {
    return relate(shape1, shape2).covered();
  }
  function contain(shape1, shape2) {
    return inside(shape2, shape1);
  }
  function cover(shape1, shape2) {
    return covered(shape2, shape1);
  }
  function relate(shape1, shape2) {
    if (shape1 instanceof Flatten.Line && shape2 instanceof Flatten.Line) {
      return relateLine2Line(shape1, shape2);
    } else if (shape1 instanceof Flatten.Line && shape2 instanceof Flatten.Circle) {
      return relateLine2Circle(shape1, shape2);
    } else if (shape1 instanceof Flatten.Line && shape2 instanceof Flatten.Box) {
      return relateLine2Box(shape1, shape2);
    } else if (shape1 instanceof Flatten.Line && shape2 instanceof Flatten.Polygon) {
      return relateLine2Polygon(shape1, shape2);
    } else if ((shape1 instanceof Flatten.Segment || shape1 instanceof Flatten.Arc) && shape2 instanceof Flatten.Polygon) {
      return relateShape2Polygon(shape1, shape2);
    } else if ((shape1 instanceof Flatten.Segment || shape1 instanceof Flatten.Arc) && (shape2 instanceof Flatten.Circle || shape2 instanceof Flatten.Box)) {
      return relateShape2Polygon(shape1, new Flatten.Polygon(shape2));
    } else if (shape1 instanceof Flatten.Polygon && shape2 instanceof Flatten.Polygon) {
      return relatePolygon2Polygon(shape1, shape2);
    } else if ((shape1 instanceof Flatten.Circle || shape1 instanceof Flatten.Box) && (shape2 instanceof Flatten.Circle || shape2 instanceof Flatten.Box)) {
      return relatePolygon2Polygon(new Flatten.Polygon(shape1), new Flatten.Polygon(shape2));
    } else if ((shape1 instanceof Flatten.Circle || shape1 instanceof Flatten.Box) && shape2 instanceof Flatten.Polygon) {
      return relatePolygon2Polygon(new Flatten.Polygon(shape1), shape2);
    } else if (shape1 instanceof Flatten.Polygon && (shape2 instanceof Flatten.Circle || shape2 instanceof Flatten.Box)) {
      return relatePolygon2Polygon(shape1, new Flatten.Polygon(shape2));
    }
  }
  function relateLine2Line(line1, line2) {
    let denim = new DE9IM();
    let ip = intersectLine2Line(line1, line2);
    if (ip.length === 0) {
      if (line1.contains(line2.pt) && line2.contains(line1.pt)) {
        denim.I2I = [line1];
        denim.I2E = [];
        denim.E2I = [];
      } else {
        denim.I2I = [];
        denim.I2E = [line1];
        denim.E2I = [line2];
      }
    } else {
      denim.I2I = ip;
      denim.I2E = line1.split(ip);
      denim.E2I = line2.split(ip);
    }
    return denim;
  }
  function relateLine2Circle(line2, circle2) {
    let denim = new DE9IM();
    let ip = intersectLine2Circle(line2, circle2);
    if (ip.length === 0) {
      denim.I2I = [];
      denim.I2B = [];
      denim.I2E = [line2];
      denim.E2I = [circle2];
    } else if (ip.length === 1) {
      denim.I2I = [];
      denim.I2B = ip;
      denim.I2E = line2.split(ip);
      denim.E2I = [circle2];
    } else {
      let multiline2 = new Multiline([line2]);
      let ip_sorted = line2.sortPoints(ip);
      multiline2.split(ip_sorted);
      let splitShapes = multiline2.toShapes();
      denim.I2I = [splitShapes[1]];
      denim.I2B = ip_sorted;
      denim.I2E = [splitShapes[0], splitShapes[2]];
      denim.E2I = new Flatten.Polygon([circle2.toArc()]).cut(multiline2);
    }
    return denim;
  }
  function relateLine2Box(line2, box2) {
    let denim = new DE9IM();
    let ip = intersectLine2Box(line2, box2);
    if (ip.length === 0) {
      denim.I2I = [];
      denim.I2B = [];
      denim.I2E = [line2];
      denim.E2I = [box2];
    } else if (ip.length === 1) {
      denim.I2I = [];
      denim.I2B = ip;
      denim.I2E = line2.split(ip);
      denim.E2I = [box2];
    } else {
      let multiline2 = new Multiline([line2]);
      let ip_sorted = line2.sortPoints(ip);
      multiline2.split(ip_sorted);
      let splitShapes = multiline2.toShapes();
      if (box2.toSegments().some((segment2) => segment2.contains(ip[0]) && segment2.contains(ip[1]))) {
        denim.I2I = [];
        denim.I2B = [splitShapes[1]];
        denim.I2E = [splitShapes[0], splitShapes[2]];
        denim.E2I = [box2];
      } else {
        denim.I2I = [splitShapes[1]];
        denim.I2B = ip_sorted;
        denim.I2E = [splitShapes[0], splitShapes[2]];
        denim.E2I = new Flatten.Polygon(box2.toSegments()).cut(multiline2);
      }
    }
    return denim;
  }
  function relateLine2Polygon(line2, polygon2) {
    let denim = new DE9IM();
    let ip = intersectLine2Polygon(line2, polygon2);
    let multiline2 = new Multiline([line2]);
    let ip_sorted = ip.length > 0 ? ip.slice() : line2.sortPoints(ip);
    multiline2.split(ip_sorted);
    [...multiline2].forEach((edge) => edge.setInclusion(polygon2));
    denim.I2I = [...multiline2].filter((edge) => edge.bv === Flatten.INSIDE).map((edge) => edge.shape);
    denim.I2B = [...multiline2].slice(1).map((edge) => edge.bv === Flatten.BOUNDARY ? edge.shape : edge.shape.start);
    denim.I2E = [...multiline2].filter((edge) => edge.bv === Flatten.OUTSIDE).map((edge) => edge.shape);
    denim.E2I = polygon2.cut(multiline2);
    return denim;
  }
  function relateShape2Polygon(shape, polygon2) {
    let denim = new DE9IM();
    let ip = intersectShape2Polygon(shape, polygon2);
    let ip_sorted = ip.length > 0 ? ip.slice() : shape.sortPoints(ip);
    let multiline2 = new Multiline([shape]);
    multiline2.split(ip_sorted);
    [...multiline2].forEach((edge) => edge.setInclusion(polygon2));
    denim.I2I = [...multiline2].filter((edge) => edge.bv === Flatten.INSIDE).map((edge) => edge.shape);
    denim.I2B = [...multiline2].slice(1).map((edge) => edge.bv === Flatten.BOUNDARY ? edge.shape : edge.shape.start);
    denim.I2E = [...multiline2].filter((edge) => edge.bv === Flatten.OUTSIDE).map((edge) => edge.shape);
    denim.B2I = [];
    denim.B2B = [];
    denim.B2E = [];
    for (let pt of [shape.start, shape.end]) {
      switch (ray_shoot(polygon2, pt)) {
        case Flatten.INSIDE:
          denim.B2I.push(pt);
          break;
        case Flatten.BOUNDARY:
          denim.B2B.push(pt);
          break;
        case Flatten.OUTSIDE:
          denim.B2E.push(pt);
          break;
        default:
          break;
      }
    }
    return denim;
  }
  function relatePolygon2Polygon(polygon1, polygon2) {
    let denim = new DE9IM();
    let [ip_sorted1, ip_sorted2] = calculateIntersections(polygon1, polygon2);
    let boolean_intersection = intersect(polygon1, polygon2);
    let boolean_difference1 = subtract(polygon1, polygon2);
    let boolean_difference2 = subtract(polygon2, polygon1);
    let [inner_clip_shapes1, inner_clip_shapes2] = innerClip(polygon1, polygon2);
    let outer_clip_shapes1 = outerClip(polygon1, polygon2);
    let outer_clip_shapes2 = outerClip(polygon2, polygon1);
    denim.I2I = boolean_intersection.isEmpty() ? [] : [boolean_intersection];
    denim.I2B = inner_clip_shapes2;
    denim.I2E = boolean_difference1.isEmpty() ? [] : [boolean_difference1];
    denim.B2I = inner_clip_shapes1;
    denim.B2B = ip_sorted1;
    denim.B2E = outer_clip_shapes1;
    denim.E2I = boolean_difference2.isEmpty() ? [] : [boolean_difference2];
    denim.E2B = outer_clip_shapes2;
    return denim;
  }
  var Relations = /* @__PURE__ */ Object.freeze({
    equal,
    intersect: intersect$1,
    touch,
    disjoint,
    inside,
    covered,
    contain,
    cover,
    relate
  });
  var Matrix = class {
    constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
      this.a = a;
      this.b = b;
      this.c = c;
      this.d = d;
      this.tx = tx;
      this.ty = ty;
    }
    clone() {
      return new Matrix(this.a, this.b, this.c, this.d, this.tx, this.ty);
    }
    transform(vector2) {
      return [
        vector2[0] * this.a + vector2[1] * this.c + this.tx,
        vector2[0] * this.b + vector2[1] * this.d + this.ty
      ];
    }
    multiply(other_matrix) {
      return new Matrix(this.a * other_matrix.a + this.c * other_matrix.b, this.b * other_matrix.a + this.d * other_matrix.b, this.a * other_matrix.c + this.c * other_matrix.d, this.b * other_matrix.c + this.d * other_matrix.d, this.a * other_matrix.tx + this.c * other_matrix.ty + this.tx, this.b * other_matrix.tx + this.d * other_matrix.ty + this.ty);
    }
    translate(...args) {
      let tx, ty;
      if (args.length == 1 && args[0] instanceof Flatten.Vector) {
        tx = args[0].x;
        ty = args[0].y;
      } else if (args.length == 2 && typeof args[0] == "number" && typeof args[1] == "number") {
        tx = args[0];
        ty = args[1];
      } else {
        throw Flatten.Errors.ILLEGAL_PARAMETERS;
      }
      return this.multiply(new Matrix(1, 0, 0, 1, tx, ty));
    }
    rotate(angle) {
      let cos = Math.cos(angle);
      let sin = Math.sin(angle);
      return this.multiply(new Matrix(cos, sin, -sin, cos, 0, 0));
    }
    scale(sx, sy) {
      return this.multiply(new Matrix(sx, 0, 0, sy, 0, 0));
    }
    equalTo(matrix2) {
      if (!Flatten.Utils.EQ(this.tx, matrix2.tx))
        return false;
      if (!Flatten.Utils.EQ(this.ty, matrix2.ty))
        return false;
      if (!Flatten.Utils.EQ(this.a, matrix2.a))
        return false;
      if (!Flatten.Utils.EQ(this.b, matrix2.b))
        return false;
      if (!Flatten.Utils.EQ(this.c, matrix2.c))
        return false;
      if (!Flatten.Utils.EQ(this.d, matrix2.d))
        return false;
      return true;
    }
  };
  Flatten.Matrix = Matrix;
  var matrix = (...args) => new Flatten.Matrix(...args);
  Flatten.matrix = matrix;
  var Interval = class Interval2 {
    constructor(low, high) {
      this.low = low;
      this.high = high;
    }
    clone() {
      return new Interval2(this.low, this.high);
    }
    get max() {
      return this.clone();
    }
    less_than(other_interval) {
      return this.low < other_interval.low || this.low == other_interval.low && this.high < other_interval.high;
    }
    equal_to(other_interval) {
      return this.low == other_interval.low && this.high == other_interval.high;
    }
    intersect(other_interval) {
      return !this.not_intersect(other_interval);
    }
    not_intersect(other_interval) {
      return this.high < other_interval.low || other_interval.high < this.low;
    }
    merge(other_interval) {
      return new Interval2(this.low === void 0 ? other_interval.low : Math.min(this.low, other_interval.low), this.high === void 0 ? other_interval.high : Math.max(this.high, other_interval.high));
    }
    output() {
      return [this.low, this.high];
    }
    static comparable_max(interval1, interval2) {
      return interval1.merge(interval2);
    }
    static comparable_less_than(val1, val2) {
      return val1 < val2;
    }
  };
  var RB_TREE_COLOR_RED = 0;
  var RB_TREE_COLOR_BLACK = 1;
  var Node = class {
    constructor(key = void 0, value = void 0, left = null, right = null, parent = null, color = RB_TREE_COLOR_BLACK) {
      this.left = left;
      this.right = right;
      this.parent = parent;
      this.color = color;
      this.item = { key, value };
      if (key && key instanceof Array && key.length == 2) {
        if (!Number.isNaN(key[0]) && !Number.isNaN(key[1])) {
          this.item.key = new Interval(Math.min(key[0], key[1]), Math.max(key[0], key[1]));
        }
      }
      this.max = this.item.key ? this.item.key.max : void 0;
    }
    isNil() {
      return this.item.key === void 0 && this.item.value === void 0 && this.left === null && this.right === null && this.color === RB_TREE_COLOR_BLACK;
    }
    less_than(other_node) {
      if (this.item.value === this.item.key && other_node.item.value === other_node.item.key) {
        return this.item.key.less_than(other_node.item.key);
      } else {
        let value_less_than = this.item.value && other_node.item.value && this.item.value.less_than ? this.item.value.less_than(other_node.item.value) : this.item.value < other_node.item.value;
        return this.item.key.less_than(other_node.item.key) || this.item.key.equal_to(other_node.item.key) && value_less_than;
      }
    }
    equal_to(other_node) {
      if (this.item.value === this.item.key && other_node.item.value === other_node.item.key) {
        return this.item.key.equal_to(other_node.item.key);
      } else {
        let value_equal = this.item.value && other_node.item.value && this.item.value.equal_to ? this.item.value.equal_to(other_node.item.value) : this.item.value == other_node.item.value;
        return this.item.key.equal_to(other_node.item.key) && value_equal;
      }
    }
    intersect(other_node) {
      return this.item.key.intersect(other_node.item.key);
    }
    copy_data(other_node) {
      this.item.key = other_node.item.key.clone();
      this.item.value = other_node.item.value && other_node.item.value.clone ? other_node.item.value.clone() : other_node.item.value;
    }
    update_max() {
      this.max = this.item.key ? this.item.key.max : void 0;
      if (this.right && this.right.max) {
        const comparable_max = this.item.key.constructor.comparable_max;
        this.max = comparable_max(this.max, this.right.max);
      }
      if (this.left && this.left.max) {
        const comparable_max = this.item.key.constructor.comparable_max;
        this.max = comparable_max(this.max, this.left.max);
      }
    }
    not_intersect_left_subtree(search_node) {
      const comparable_less_than = this.item.key.constructor.comparable_less_than;
      let high = this.left.max.high !== void 0 ? this.left.max.high : this.left.max;
      return comparable_less_than(high, search_node.item.key.low);
    }
    not_intersect_right_subtree(search_node) {
      const comparable_less_than = this.item.key.constructor.comparable_less_than;
      let low = this.right.max.low !== void 0 ? this.right.max.low : this.right.item.key.low;
      return comparable_less_than(search_node.item.key.high, low);
    }
  };
  var IntervalTree = class {
    constructor() {
      this.root = null;
      this.nil_node = new Node();
    }
    get size() {
      let count = 0;
      this.tree_walk(this.root, () => count++);
      return count;
    }
    get keys() {
      let res = [];
      this.tree_walk(this.root, (node) => res.push(node.item.key.output ? node.item.key.output() : node.item.key));
      return res;
    }
    get values() {
      let res = [];
      this.tree_walk(this.root, (node) => res.push(node.item.value));
      return res;
    }
    get items() {
      let res = [];
      this.tree_walk(this.root, (node) => res.push({
        key: node.item.key.output ? node.item.key.output() : node.item.key,
        value: node.item.value
      }));
      return res;
    }
    isEmpty() {
      return this.root == null || this.root == this.nil_node;
    }
    insert(key, value = key) {
      if (key === void 0)
        return;
      let insert_node = new Node(key, value, this.nil_node, this.nil_node, null, RB_TREE_COLOR_RED);
      this.tree_insert(insert_node);
      this.recalc_max(insert_node);
      return insert_node;
    }
    exist(key, value = key) {
      let search_node = new Node(key, value);
      return this.tree_search(this.root, search_node) ? true : false;
    }
    remove(key, value = key) {
      let search_node = new Node(key, value);
      let delete_node = this.tree_search(this.root, search_node);
      if (delete_node) {
        this.tree_delete(delete_node);
      }
      return delete_node;
    }
    search(interval, outputMapperFn = (value, key) => value === key ? key.output() : value) {
      let search_node = new Node(interval);
      let resp_nodes = [];
      this.tree_search_interval(this.root, search_node, resp_nodes);
      return resp_nodes.map((node) => outputMapperFn(node.item.value, node.item.key));
    }
    intersect_any(interval) {
      let search_node = new Node(interval);
      let found = this.tree_find_any_interval(this.root, search_node);
      return found;
    }
    forEach(visitor) {
      this.tree_walk(this.root, (node) => visitor(node.item.key, node.item.value));
    }
    map(callback) {
      const tree = new IntervalTree();
      this.tree_walk(this.root, (node) => tree.insert(node.item.key, callback(node.item.value, node.item.key)));
      return tree;
    }
    recalc_max(node) {
      let node_current = node;
      while (node_current.parent != null) {
        node_current.parent.update_max();
        node_current = node_current.parent;
      }
    }
    tree_insert(insert_node) {
      let current_node = this.root;
      let parent_node = null;
      if (this.root == null || this.root == this.nil_node) {
        this.root = insert_node;
      } else {
        while (current_node != this.nil_node) {
          parent_node = current_node;
          if (insert_node.less_than(current_node)) {
            current_node = current_node.left;
          } else {
            current_node = current_node.right;
          }
        }
        insert_node.parent = parent_node;
        if (insert_node.less_than(parent_node)) {
          parent_node.left = insert_node;
        } else {
          parent_node.right = insert_node;
        }
      }
      this.insert_fixup(insert_node);
    }
    insert_fixup(insert_node) {
      let current_node;
      let uncle_node;
      current_node = insert_node;
      while (current_node != this.root && current_node.parent.color == RB_TREE_COLOR_RED) {
        if (current_node.parent == current_node.parent.parent.left) {
          uncle_node = current_node.parent.parent.right;
          if (uncle_node.color == RB_TREE_COLOR_RED) {
            current_node.parent.color = RB_TREE_COLOR_BLACK;
            uncle_node.color = RB_TREE_COLOR_BLACK;
            current_node.parent.parent.color = RB_TREE_COLOR_RED;
            current_node = current_node.parent.parent;
          } else {
            if (current_node == current_node.parent.right) {
              current_node = current_node.parent;
              this.rotate_left(current_node);
            }
            current_node.parent.color = RB_TREE_COLOR_BLACK;
            current_node.parent.parent.color = RB_TREE_COLOR_RED;
            this.rotate_right(current_node.parent.parent);
          }
        } else {
          uncle_node = current_node.parent.parent.left;
          if (uncle_node.color == RB_TREE_COLOR_RED) {
            current_node.parent.color = RB_TREE_COLOR_BLACK;
            uncle_node.color = RB_TREE_COLOR_BLACK;
            current_node.parent.parent.color = RB_TREE_COLOR_RED;
            current_node = current_node.parent.parent;
          } else {
            if (current_node == current_node.parent.left) {
              current_node = current_node.parent;
              this.rotate_right(current_node);
            }
            current_node.parent.color = RB_TREE_COLOR_BLACK;
            current_node.parent.parent.color = RB_TREE_COLOR_RED;
            this.rotate_left(current_node.parent.parent);
          }
        }
      }
      this.root.color = RB_TREE_COLOR_BLACK;
    }
    tree_delete(delete_node) {
      let cut_node;
      let fix_node;
      if (delete_node.left == this.nil_node || delete_node.right == this.nil_node) {
        cut_node = delete_node;
      } else {
        cut_node = this.tree_successor(delete_node);
      }
      if (cut_node.left != this.nil_node) {
        fix_node = cut_node.left;
      } else {
        fix_node = cut_node.right;
      }
      fix_node.parent = cut_node.parent;
      if (cut_node == this.root) {
        this.root = fix_node;
      } else {
        if (cut_node == cut_node.parent.left) {
          cut_node.parent.left = fix_node;
        } else {
          cut_node.parent.right = fix_node;
        }
        cut_node.parent.update_max();
      }
      this.recalc_max(fix_node);
      if (cut_node != delete_node) {
        delete_node.copy_data(cut_node);
        delete_node.update_max();
        this.recalc_max(delete_node);
      }
      if (cut_node.color == RB_TREE_COLOR_BLACK) {
        this.delete_fixup(fix_node);
      }
    }
    delete_fixup(fix_node) {
      let current_node = fix_node;
      let brother_node;
      while (current_node != this.root && current_node.parent != null && current_node.color == RB_TREE_COLOR_BLACK) {
        if (current_node == current_node.parent.left) {
          brother_node = current_node.parent.right;
          if (brother_node.color == RB_TREE_COLOR_RED) {
            brother_node.color = RB_TREE_COLOR_BLACK;
            current_node.parent.color = RB_TREE_COLOR_RED;
            this.rotate_left(current_node.parent);
            brother_node = current_node.parent.right;
          }
          if (brother_node.left.color == RB_TREE_COLOR_BLACK && brother_node.right.color == RB_TREE_COLOR_BLACK) {
            brother_node.color = RB_TREE_COLOR_RED;
            current_node = current_node.parent;
          } else {
            if (brother_node.right.color == RB_TREE_COLOR_BLACK) {
              brother_node.color = RB_TREE_COLOR_RED;
              brother_node.left.color = RB_TREE_COLOR_BLACK;
              this.rotate_right(brother_node);
              brother_node = current_node.parent.right;
            }
            brother_node.color = current_node.parent.color;
            current_node.parent.color = RB_TREE_COLOR_BLACK;
            brother_node.right.color = RB_TREE_COLOR_BLACK;
            this.rotate_left(current_node.parent);
            current_node = this.root;
          }
        } else {
          brother_node = current_node.parent.left;
          if (brother_node.color == RB_TREE_COLOR_RED) {
            brother_node.color = RB_TREE_COLOR_BLACK;
            current_node.parent.color = RB_TREE_COLOR_RED;
            this.rotate_right(current_node.parent);
            brother_node = current_node.parent.left;
          }
          if (brother_node.left.color == RB_TREE_COLOR_BLACK && brother_node.right.color == RB_TREE_COLOR_BLACK) {
            brother_node.color = RB_TREE_COLOR_RED;
            current_node = current_node.parent;
          } else {
            if (brother_node.left.color == RB_TREE_COLOR_BLACK) {
              brother_node.color = RB_TREE_COLOR_RED;
              brother_node.right.color = RB_TREE_COLOR_BLACK;
              this.rotate_left(brother_node);
              brother_node = current_node.parent.left;
            }
            brother_node.color = current_node.parent.color;
            current_node.parent.color = RB_TREE_COLOR_BLACK;
            brother_node.left.color = RB_TREE_COLOR_BLACK;
            this.rotate_right(current_node.parent);
            current_node = this.root;
          }
        }
      }
      current_node.color = RB_TREE_COLOR_BLACK;
    }
    tree_search(node, search_node) {
      if (node == null || node == this.nil_node)
        return void 0;
      if (search_node.equal_to(node)) {
        return node;
      }
      if (search_node.less_than(node)) {
        return this.tree_search(node.left, search_node);
      } else {
        return this.tree_search(node.right, search_node);
      }
    }
    tree_search_interval(node, search_node, res) {
      if (node != null && node != this.nil_node) {
        if (node.left != this.nil_node && !node.not_intersect_left_subtree(search_node)) {
          this.tree_search_interval(node.left, search_node, res);
        }
        if (node.intersect(search_node)) {
          res.push(node);
        }
        if (node.right != this.nil_node && !node.not_intersect_right_subtree(search_node)) {
          this.tree_search_interval(node.right, search_node, res);
        }
      }
    }
    tree_find_any_interval(node, search_node) {
      let found = false;
      if (node != null && node != this.nil_node) {
        if (node.left != this.nil_node && !node.not_intersect_left_subtree(search_node)) {
          found = this.tree_find_any_interval(node.left, search_node);
        }
        if (!found) {
          found = node.intersect(search_node);
        }
        if (!found && node.right != this.nil_node && !node.not_intersect_right_subtree(search_node)) {
          found = this.tree_find_any_interval(node.right, search_node);
        }
      }
      return found;
    }
    local_minimum(node) {
      let node_min = node;
      while (node_min.left != null && node_min.left != this.nil_node) {
        node_min = node_min.left;
      }
      return node_min;
    }
    local_maximum(node) {
      let node_max = node;
      while (node_max.right != null && node_max.right != this.nil_node) {
        node_max = node_max.right;
      }
      return node_max;
    }
    tree_successor(node) {
      let node_successor;
      let current_node;
      let parent_node;
      if (node.right != this.nil_node) {
        node_successor = this.local_minimum(node.right);
      } else {
        current_node = node;
        parent_node = node.parent;
        while (parent_node != null && parent_node.right == current_node) {
          current_node = parent_node;
          parent_node = parent_node.parent;
        }
        node_successor = parent_node;
      }
      return node_successor;
    }
    rotate_left(x) {
      let y = x.right;
      x.right = y.left;
      if (y.left != this.nil_node) {
        y.left.parent = x;
      }
      y.parent = x.parent;
      if (x == this.root) {
        this.root = y;
      } else {
        if (x == x.parent.left) {
          x.parent.left = y;
        } else {
          x.parent.right = y;
        }
      }
      y.left = x;
      x.parent = y;
      if (x != null && x != this.nil_node) {
        x.update_max();
      }
      y = x.parent;
      if (y != null && y != this.nil_node) {
        y.update_max();
      }
    }
    rotate_right(y) {
      let x = y.left;
      y.left = x.right;
      if (x.right != this.nil_node) {
        x.right.parent = y;
      }
      x.parent = y.parent;
      if (y == this.root) {
        this.root = x;
      } else {
        if (y == y.parent.left) {
          y.parent.left = x;
        } else {
          y.parent.right = x;
        }
      }
      x.right = y;
      y.parent = x;
      if (y != null && y != this.nil_node) {
        y.update_max();
      }
      x = y.parent;
      if (x != null && x != this.nil_node) {
        x.update_max();
      }
    }
    tree_walk(node, action) {
      if (node != null && node != this.nil_node) {
        this.tree_walk(node.left, action);
        action(node);
        this.tree_walk(node.right, action);
      }
    }
    testRedBlackProperty() {
      let res = true;
      this.tree_walk(this.root, function(node) {
        if (node.color == RB_TREE_COLOR_RED) {
          if (!(node.left.color == RB_TREE_COLOR_BLACK && node.right.color == RB_TREE_COLOR_BLACK)) {
            res = false;
          }
        }
      });
      return res;
    }
    testBlackHeightProperty(node) {
      let height = 0;
      let heightLeft = 0;
      let heightRight = 0;
      if (node.color == RB_TREE_COLOR_BLACK) {
        height++;
      }
      if (node.left != this.nil_node) {
        heightLeft = this.testBlackHeightProperty(node.left);
      } else {
        heightLeft = 1;
      }
      if (node.right != this.nil_node) {
        heightRight = this.testBlackHeightProperty(node.right);
      } else {
        heightRight = 1;
      }
      if (heightLeft != heightRight) {
        throw new Error("Red-black height property violated");
      }
      height += heightLeft;
      return height;
    }
  };
  var PlanarSet = class extends Set {
    constructor(shapes) {
      super(shapes);
      this.index = new IntervalTree();
      this.forEach((shape) => this.index.insert(shape));
    }
    add(shape) {
      let size = this.size;
      super.add(shape);
      if (this.size > size) {
        let node = this.index.insert(shape.box, shape);
      }
      return this;
    }
    delete(shape) {
      let deleted = super.delete(shape);
      if (deleted) {
        this.index.remove(shape.box, shape);
      }
      return deleted;
    }
    clear() {
      super.clear();
      this.index = new IntervalTree();
    }
    search(box2) {
      let resp = this.index.search(box2);
      return resp;
    }
    hit(point2) {
      let box2 = new Flatten.Box(point2.x - 1, point2.y - 1, point2.x + 1, point2.y + 1);
      let resp = this.index.search(box2);
      return resp.filter((shape) => point2.on(shape));
    }
    svg() {
      let svgcontent = [...this].reduce((acc, shape) => acc + shape.svg(), "");
      return svgcontent;
    }
  };
  Flatten.PlanarSet = PlanarSet;
  var Point = class {
    constructor(...args) {
      this.x = 0;
      this.y = 0;
      if (args.length === 0) {
        return;
      }
      if (args.length === 1 && args[0] instanceof Array && args[0].length === 2) {
        let arr = args[0];
        if (typeof arr[0] == "number" && typeof arr[1] == "number") {
          this.x = arr[0];
          this.y = arr[1];
          return;
        }
      }
      if (args.length === 1 && args[0] instanceof Object && args[0].name === "point") {
        let { x, y } = args[0];
        this.x = x;
        this.y = y;
        return;
      }
      if (args.length === 2) {
        if (typeof args[0] == "number" && typeof args[1] == "number") {
          this.x = args[0];
          this.y = args[1];
          return;
        }
      }
      throw Flatten.Errors.ILLEGAL_PARAMETERS;
    }
    get box() {
      return new Flatten.Box(this.x, this.y, this.x, this.y);
    }
    clone() {
      return new Flatten.Point(this.x, this.y);
    }
    get vertices() {
      return [this.clone()];
    }
    equalTo(pt) {
      return Flatten.Utils.EQ(this.x, pt.x) && Flatten.Utils.EQ(this.y, pt.y);
    }
    lessThan(pt) {
      if (Flatten.Utils.LT(this.y, pt.y))
        return true;
      if (Flatten.Utils.EQ(this.y, pt.y) && Flatten.Utils.LT(this.x, pt.x))
        return true;
      return false;
    }
    rotate(angle, center = { x: 0, y: 0 }) {
      var x_rot = center.x + (this.x - center.x) * Math.cos(angle) - (this.y - center.y) * Math.sin(angle);
      var y_rot = center.y + (this.x - center.x) * Math.sin(angle) + (this.y - center.y) * Math.cos(angle);
      return new Flatten.Point(x_rot, y_rot);
    }
    translate(...args) {
      if (args.length == 1 && (args[0] instanceof Flatten.Vector || !isNaN(args[0].x) && !isNaN(args[0].y))) {
        return new Flatten.Point(this.x + args[0].x, this.y + args[0].y);
      }
      if (args.length == 2 && typeof args[0] == "number" && typeof args[1] == "number") {
        return new Flatten.Point(this.x + args[0], this.y + args[1]);
      }
      throw Flatten.Errors.ILLEGAL_PARAMETERS;
    }
    transform(m) {
      return new Flatten.Point(m.transform([this.x, this.y]));
    }
    projectionOn(line2) {
      if (this.equalTo(line2.pt))
        return this.clone();
      let vec = new Flatten.Vector(this, line2.pt);
      if (Flatten.Utils.EQ_0(vec.cross(line2.norm)))
        return line2.pt.clone();
      let dist = vec.dot(line2.norm);
      let proj_vec = line2.norm.multiply(dist);
      return this.translate(proj_vec);
    }
    leftTo(line2) {
      let vec = new Flatten.Vector(line2.pt, this);
      let onLeftSemiPlane = Flatten.Utils.GT(vec.dot(line2.norm), 0);
      return onLeftSemiPlane;
    }
    distanceTo(shape) {
      if (shape instanceof Point) {
        let dx = shape.x - this.x;
        let dy = shape.y - this.y;
        return [Math.sqrt(dx * dx + dy * dy), new Flatten.Segment(this, shape)];
      }
      if (shape instanceof Flatten.Line) {
        return Flatten.Distance.point2line(this, shape);
      }
      if (shape instanceof Flatten.Circle) {
        return Flatten.Distance.point2circle(this, shape);
      }
      if (shape instanceof Flatten.Segment) {
        return Flatten.Distance.point2segment(this, shape);
      }
      if (shape instanceof Flatten.Arc) {
        return Flatten.Distance.point2arc(this, shape);
      }
      if (shape instanceof Flatten.Polygon) {
        return Flatten.Distance.point2polygon(this, shape);
      }
      if (shape instanceof Flatten.PlanarSet) {
        return Flatten.Distance.shape2planarSet(this, shape);
      }
    }
    on(shape) {
      if (shape instanceof Flatten.Point) {
        return this.equalTo(shape);
      }
      if (shape instanceof Flatten.Line) {
        return shape.contains(this);
      }
      if (shape instanceof Flatten.Circle) {
        return shape.contains(this);
      }
      if (shape instanceof Flatten.Segment) {
        return shape.contains(this);
      }
      if (shape instanceof Flatten.Arc) {
        return shape.contains(this);
      }
      if (shape instanceof Flatten.Polygon) {
        return shape.contains(this);
      }
    }
    toJSON() {
      return Object.assign({}, this, { name: "point" });
    }
    svg(attrs = {}) {
      let { r, stroke, strokeWidth, fill, id, className } = attrs;
      let id_str = id && id.length > 0 ? `id="${id}"` : "";
      let class_str = className && className.length > 0 ? `class="${className}"` : "";
      return `
<circle cx="${this.x}" cy="${this.y}" r="${r || 3}" stroke="${stroke || "black"}" stroke-width="${strokeWidth || 1}" fill="${fill || "red"}" ${id_str} ${class_str} />`;
    }
  };
  Flatten.Point = Point;
  var point = (...args) => new Flatten.Point(...args);
  Flatten.point = point;
  var Vector = class {
    constructor(...args) {
      this.x = 0;
      this.y = 0;
      if (args.length === 0) {
        return;
      }
      if (args.length === 1 && args[0] instanceof Array && args[0].length === 2) {
        let arr = args[0];
        if (typeof arr[0] == "number" && typeof arr[1] == "number") {
          this.x = arr[0];
          this.y = arr[1];
          return;
        }
      }
      if (args.length === 1 && args[0] instanceof Object && args[0].name === "vector") {
        let { x, y } = args[0];
        this.x = x;
        this.y = y;
        return;
      }
      if (args.length === 2) {
        let a1 = args[0];
        let a2 = args[1];
        if (typeof a1 == "number" && typeof a2 == "number") {
          this.x = a1;
          this.y = a2;
          return;
        }
        if (a1 instanceof Flatten.Point && a2 instanceof Flatten.Point) {
          this.x = a2.x - a1.x;
          this.y = a2.y - a1.y;
          return;
        }
      }
      throw Flatten.Errors.ILLEGAL_PARAMETERS;
    }
    clone() {
      return new Flatten.Vector(this.x, this.y);
    }
    get slope() {
      let angle = Math.atan2(this.y, this.x);
      if (angle < 0)
        angle = 2 * Math.PI + angle;
      return angle;
    }
    get length() {
      return Math.sqrt(this.dot(this));
    }
    equalTo(v) {
      return Flatten.Utils.EQ(this.x, v.x) && Flatten.Utils.EQ(this.y, v.y);
    }
    multiply(scalar) {
      return new Flatten.Vector(scalar * this.x, scalar * this.y);
    }
    dot(v) {
      return this.x * v.x + this.y * v.y;
    }
    cross(v) {
      return this.x * v.y - this.y * v.x;
    }
    normalize() {
      if (!Flatten.Utils.EQ_0(this.length)) {
        return new Flatten.Vector(this.x / this.length, this.y / this.length);
      }
      throw Flatten.Errors.ZERO_DIVISION;
    }
    rotate(angle) {
      let point2 = new Flatten.Point(this.x, this.y);
      let rpoint = point2.rotate(angle);
      return new Flatten.Vector(rpoint.x, rpoint.y);
    }
    rotate90CCW() {
      return new Flatten.Vector(-this.y, this.x);
    }
    rotate90CW() {
      return new Flatten.Vector(this.y, -this.x);
    }
    invert() {
      return new Flatten.Vector(-this.x, -this.y);
    }
    add(v) {
      return new Flatten.Vector(this.x + v.x, this.y + v.y);
    }
    subtract(v) {
      return new Flatten.Vector(this.x - v.x, this.y - v.y);
    }
    angleTo(v) {
      let norm1 = this.normalize();
      let norm2 = v.normalize();
      let angle = Math.atan2(norm1.cross(norm2), norm1.dot(norm2));
      if (angle < 0)
        angle += 2 * Math.PI;
      return angle;
    }
    projectionOn(v) {
      let n = v.normalize();
      let d = this.dot(n);
      return n.multiply(d);
    }
    toJSON() {
      return Object.assign({}, this, { name: "vector" });
    }
  };
  Flatten.Vector = Vector;
  var vector = (...args) => new Flatten.Vector(...args);
  Flatten.vector = vector;
  var Segment = class {
    constructor(...args) {
      this.ps = new Flatten.Point();
      this.pe = new Flatten.Point();
      if (args.length === 0) {
        return;
      }
      if (args.length === 1 && args[0] instanceof Array && args[0].length === 4) {
        let coords = args[0];
        this.ps = new Flatten.Point(coords[0], coords[1]);
        this.pe = new Flatten.Point(coords[2], coords[3]);
        return;
      }
      if (args.length === 1 && args[0] instanceof Object && args[0].name === "segment") {
        let { ps, pe } = args[0];
        this.ps = new Flatten.Point(ps.x, ps.y);
        this.pe = new Flatten.Point(pe.x, pe.y);
        return;
      }
      if (args.length === 1 && args[0] instanceof Flatten.Point) {
        this.ps = args[0].clone();
        return;
      }
      if (args.length === 2 && args[0] instanceof Flatten.Point && args[1] instanceof Flatten.Point) {
        this.ps = args[0].clone();
        this.pe = args[1].clone();
        return;
      }
      if (args.length === 4) {
        this.ps = new Flatten.Point(args[0], args[1]);
        this.pe = new Flatten.Point(args[2], args[3]);
        return;
      }
      throw Flatten.Errors.ILLEGAL_PARAMETERS;
    }
    clone() {
      return new Flatten.Segment(this.start, this.end);
    }
    get start() {
      return this.ps;
    }
    get end() {
      return this.pe;
    }
    get vertices() {
      return [this.ps.clone(), this.pe.clone()];
    }
    get length() {
      return this.start.distanceTo(this.end)[0];
    }
    get slope() {
      let vec = new Flatten.Vector(this.start, this.end);
      return vec.slope;
    }
    get box() {
      return new Flatten.Box(Math.min(this.start.x, this.end.x), Math.min(this.start.y, this.end.y), Math.max(this.start.x, this.end.x), Math.max(this.start.y, this.end.y));
    }
    equalTo(seg) {
      return this.ps.equalTo(seg.ps) && this.pe.equalTo(seg.pe);
    }
    contains(pt) {
      return Flatten.Utils.EQ_0(this.distanceToPoint(pt));
    }
    intersect(shape) {
      if (shape instanceof Flatten.Point) {
        return this.contains(shape) ? [shape] : [];
      }
      if (shape instanceof Flatten.Line) {
        return intersectSegment2Line(this, shape);
      }
      if (shape instanceof Flatten.Segment) {
        return intersectSegment2Segment(this, shape);
      }
      if (shape instanceof Flatten.Circle) {
        return intersectSegment2Circle(this, shape);
      }
      if (shape instanceof Flatten.Box) {
        return intersectSegment2Box(this, shape);
      }
      if (shape instanceof Flatten.Arc) {
        return intersectSegment2Arc(this, shape);
      }
      if (shape instanceof Flatten.Polygon) {
        return intersectSegment2Polygon(this, shape);
      }
    }
    distanceTo(shape) {
      if (shape instanceof Flatten.Point) {
        let [dist, shortest_segment] = Flatten.Distance.point2segment(shape, this);
        shortest_segment = shortest_segment.reverse();
        return [dist, shortest_segment];
      }
      if (shape instanceof Flatten.Circle) {
        let [dist, shortest_segment] = Flatten.Distance.segment2circle(this, shape);
        return [dist, shortest_segment];
      }
      if (shape instanceof Flatten.Line) {
        let [dist, shortest_segment] = Flatten.Distance.segment2line(this, shape);
        return [dist, shortest_segment];
      }
      if (shape instanceof Flatten.Segment) {
        let [dist, shortest_segment] = Flatten.Distance.segment2segment(this, shape);
        return [dist, shortest_segment];
      }
      if (shape instanceof Flatten.Arc) {
        let [dist, shortest_segment] = Flatten.Distance.segment2arc(this, shape);
        return [dist, shortest_segment];
      }
      if (shape instanceof Flatten.Polygon) {
        let [dist, shortest_segment] = Flatten.Distance.shape2polygon(this, shape);
        return [dist, shortest_segment];
      }
      if (shape instanceof Flatten.PlanarSet) {
        let [dist, shortest_segment] = Flatten.Distance.shape2planarSet(this, shape);
        return [dist, shortest_segment];
      }
    }
    tangentInStart() {
      let vec = new Flatten.Vector(this.start, this.end);
      return vec.normalize();
    }
    tangentInEnd() {
      let vec = new Flatten.Vector(this.end, this.start);
      return vec.normalize();
    }
    reverse() {
      return new Segment(this.end, this.start);
    }
    split(pt) {
      if (this.start.equalTo(pt))
        return [null, this.clone()];
      if (this.end.equalTo(pt))
        return [this.clone(), null];
      return [
        new Flatten.Segment(this.start, pt),
        new Flatten.Segment(pt, this.end)
      ];
    }
    middle() {
      return new Flatten.Point((this.start.x + this.end.x) / 2, (this.start.y + this.end.y) / 2);
    }
    pointAtLength(length) {
      if (length > this.length || length < 0)
        return null;
      if (length == 0)
        return this.start;
      if (length == this.length)
        return this.end;
      let factor = length / this.length;
      return new Flatten.Point((this.end.x - this.start.x) * factor + this.start.x, (this.end.y - this.start.y) * factor + this.start.y);
    }
    distanceToPoint(pt) {
      let [dist, ...rest] = Flatten.Distance.point2segment(pt, this);
      return dist;
    }
    definiteIntegral(ymin = 0) {
      let dx = this.end.x - this.start.x;
      let dy1 = this.start.y - ymin;
      let dy2 = this.end.y - ymin;
      return dx * (dy1 + dy2) / 2;
    }
    translate(...args) {
      return new Segment(this.ps.translate(...args), this.pe.translate(...args));
    }
    rotate(angle = 0, center = new Flatten.Point()) {
      let m = new Flatten.Matrix();
      m = m.translate(center.x, center.y).rotate(angle).translate(-center.x, -center.y);
      return this.transform(m);
    }
    transform(matrix2 = new Flatten.Matrix()) {
      return new Segment(this.ps.transform(matrix2), this.pe.transform(matrix2));
    }
    isZeroLength() {
      return this.ps.equalTo(this.pe);
    }
    sortPoints(pts) {
      let line2 = new Flatten.Line(this.start, this.end);
      return line2.sortPoints(pts);
    }
    toJSON() {
      return Object.assign({}, this, { name: "segment" });
    }
    svg(attrs = {}) {
      let { stroke, strokeWidth, id, className } = attrs;
      let id_str = id && id.length > 0 ? `id="${id}"` : "";
      let class_str = className && className.length > 0 ? `class="${className}"` : "";
      return `
<line x1="${this.start.x}" y1="${this.start.y}" x2="${this.end.x}" y2="${this.end.y}" stroke="${stroke || "black"}" stroke-width="${strokeWidth || 1}" ${id_str} ${class_str} />`;
    }
  };
  Flatten.Segment = Segment;
  var segment = (...args) => new Flatten.Segment(...args);
  Flatten.segment = segment;
  var { vector: vector$1 } = Flatten;
  var Line = class {
    constructor(...args) {
      this.pt = new Flatten.Point();
      this.norm = new Flatten.Vector(0, 1);
      if (args.length == 0) {
        return;
      }
      if (args.length == 1 && args[0] instanceof Object && args[0].name === "line") {
        let { pt, norm } = args[0];
        this.pt = new Flatten.Point(pt);
        this.norm = new Flatten.Vector(norm);
        return;
      }
      if (args.length == 2) {
        let a1 = args[0];
        let a2 = args[1];
        if (a1 instanceof Flatten.Point && a2 instanceof Flatten.Point) {
          this.pt = a1;
          this.norm = Line.points2norm(a1, a2);
          if (this.norm.dot(vector$1(this.pt.x, this.pt.y)) >= 0) {
            this.norm.invert();
          }
          return;
        }
        if (a1 instanceof Flatten.Point && a2 instanceof Flatten.Vector) {
          if (Flatten.Utils.EQ_0(a2.x) && Flatten.Utils.EQ_0(a2.y)) {
            throw Flatten.Errors.ILLEGAL_PARAMETERS;
          }
          this.pt = a1.clone();
          this.norm = a2.clone();
          this.norm = this.norm.normalize();
          if (this.norm.dot(vector$1(this.pt.x, this.pt.y)) >= 0) {
            this.norm.invert();
          }
          return;
        }
        if (a1 instanceof Flatten.Vector && a2 instanceof Flatten.Point) {
          if (Flatten.Utils.EQ_0(a1.x) && Flatten.Utils.EQ_0(a1.y)) {
            throw Flatten.Errors.ILLEGAL_PARAMETERS;
          }
          this.pt = a2.clone();
          this.norm = a1.clone();
          this.norm = this.norm.normalize();
          if (this.norm.dot(vector$1(this.pt.x, this.pt.y)) >= 0) {
            this.norm.invert();
          }
          return;
        }
      }
      throw Flatten.Errors.ILLEGAL_PARAMETERS;
    }
    clone() {
      return new Flatten.Line(this.pt, this.norm);
    }
    get start() {
      return void 0;
    }
    get end() {
      return void 0;
    }
    get length() {
      return Number.POSITIVE_INFINITY;
    }
    get box() {
      return new Flatten.Box(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    }
    get middle() {
      return void 0;
    }
    get slope() {
      let vec = new Flatten.Vector(this.norm.y, -this.norm.x);
      return vec.slope;
    }
    get standard() {
      let A = this.norm.x;
      let B = this.norm.y;
      let C = this.norm.dot(this.pt);
      return [A, B, C];
    }
    parallelTo(other_line) {
      return Flatten.Utils.EQ_0(this.norm.cross(other_line.norm));
    }
    incidentTo(other_line) {
      return this.parallelTo(other_line) && this.pt.on(other_line);
    }
    contains(pt) {
      if (this.pt.equalTo(pt)) {
        return true;
      }
      let vec = new Flatten.Vector(this.pt, pt);
      return Flatten.Utils.EQ_0(this.norm.dot(vec));
    }
    coord(pt) {
      return vector$1(pt.x, pt.y).cross(this.norm);
    }
    intersect(shape) {
      if (shape instanceof Flatten.Point) {
        return this.contains(shape) ? [shape] : [];
      }
      if (shape instanceof Flatten.Line) {
        return intersectLine2Line(this, shape);
      }
      if (shape instanceof Flatten.Circle) {
        return intersectLine2Circle(this, shape);
      }
      if (shape instanceof Flatten.Box) {
        return intersectLine2Box(this, shape);
      }
      if (shape instanceof Flatten.Segment) {
        return intersectSegment2Line(shape, this);
      }
      if (shape instanceof Flatten.Arc) {
        return intersectLine2Arc(this, shape);
      }
      if (shape instanceof Flatten.Polygon) {
        return intersectLine2Polygon(this, shape);
      }
    }
    distanceTo(shape) {
      if (shape instanceof Flatten.Point) {
        let [distance, shortest_segment] = Flatten.Distance.point2line(shape, this);
        shortest_segment = shortest_segment.reverse();
        return [distance, shortest_segment];
      }
      if (shape instanceof Flatten.Circle) {
        let [distance, shortest_segment] = Flatten.Distance.circle2line(shape, this);
        shortest_segment = shortest_segment.reverse();
        return [distance, shortest_segment];
      }
      if (shape instanceof Flatten.Segment) {
        let [distance, shortest_segment] = Flatten.Distance.segment2line(shape, this);
        return [distance, shortest_segment.reverse()];
      }
      if (shape instanceof Flatten.Arc) {
        let [distance, shortest_segment] = Flatten.Distance.arc2line(shape, this);
        return [distance, shortest_segment.reverse()];
      }
      if (shape instanceof Flatten.Polygon) {
        let [distance, shortest_segment] = Flatten.Distance.shape2polygon(this, shape);
        return [distance, shortest_segment];
      }
    }
    split(pt) {
      if (pt instanceof Flatten.Point) {
        return [new Flatten.Ray(pt, this.norm.invert()), new Flatten.Ray(pt, this.norm)];
      } else {
        let multiline2 = new Flatten.Multiline([this]);
        let sorted_points = this.sortPoints(pt);
        multiline2.split(sorted_points);
        return multiline2.toShapes();
      }
    }
    sortPoints(pts) {
      return pts.slice().sort((pt1, pt2) => {
        if (this.coord(pt1) < this.coord(pt2)) {
          return -1;
        }
        if (this.coord(pt1) > this.coord(pt2)) {
          return 1;
        }
        return 0;
      });
    }
    toJSON() {
      return Object.assign({}, this, { name: "line" });
    }
    svg(box2, attrs = {}) {
      let ip = intersectLine2Box(this, box2);
      if (ip.length === 0)
        return "";
      let ps = ip[0];
      let pe = ip.length == 2 ? ip[1] : ip.find((pt) => !pt.equalTo(ps));
      if (pe === void 0)
        pe = ps;
      let segment2 = new Flatten.Segment(ps, pe);
      return segment2.svg(attrs);
    }
    static points2norm(pt1, pt2) {
      if (pt1.equalTo(pt2)) {
        throw Flatten.Errors.ILLEGAL_PARAMETERS;
      }
      let vec = new Flatten.Vector(pt1, pt2);
      let unit = vec.normalize();
      return unit.rotate90CCW();
    }
  };
  Flatten.Line = Line;
  var line = (...args) => new Flatten.Line(...args);
  Flatten.line = line;
  var Circle = class {
    constructor(...args) {
      this.pc = new Flatten.Point();
      this.r = 1;
      if (args.length == 1 && args[0] instanceof Object && args[0].name === "circle") {
        let { pc, r } = args[0];
        this.pc = new Flatten.Point(pc);
        this.r = r;
        return;
      } else {
        let [pc, r] = [...args];
        if (pc && pc instanceof Flatten.Point)
          this.pc = pc.clone();
        if (r !== void 0)
          this.r = r;
        return;
      }
      throw Flatten.Errors.ILLEGAL_PARAMETERS;
    }
    clone() {
      return new Flatten.Circle(this.pc.clone(), this.r);
    }
    get center() {
      return this.pc;
    }
    get box() {
      return new Flatten.Box(this.pc.x - this.r, this.pc.y - this.r, this.pc.x + this.r, this.pc.y + this.r);
    }
    contains(shape) {
      if (shape instanceof Flatten.Point) {
        return Flatten.Utils.LE(shape.distanceTo(this.center)[0], this.r);
      }
      if (shape instanceof Flatten.Segment) {
        return Flatten.Utils.LE(shape.start.distanceTo(this.center)[0], this.r) && Flatten.Utils.LE(shape.end.distanceTo(this.center)[0], this.r);
      }
      if (shape instanceof Flatten.Arc) {
        return this.intersect(shape).length === 0 && Flatten.Utils.LE(shape.start.distanceTo(this.center)[0], this.r) && Flatten.Utils.LE(shape.end.distanceTo(this.center)[0], this.r);
      }
      if (shape instanceof Flatten.Circle) {
        return this.intersect(shape).length === 0 && Flatten.Utils.LE(shape.r, this.r) && Flatten.Utils.LE(shape.center.distanceTo(this.center)[0], this.r);
      }
    }
    toArc(counterclockwise = true) {
      return new Flatten.Arc(this.center, this.r, Math.PI, -Math.PI, counterclockwise);
    }
    intersect(shape) {
      if (shape instanceof Flatten.Point) {
        return this.contains(shape) ? [shape] : [];
      }
      if (shape instanceof Flatten.Line) {
        return intersectLine2Circle(shape, this);
      }
      if (shape instanceof Flatten.Segment) {
        return intersectSegment2Circle(shape, this);
      }
      if (shape instanceof Flatten.Circle) {
        return intersectCircle2Circle(shape, this);
      }
      if (shape instanceof Flatten.Box) {
        return intersectCircle2Box(this, shape);
      }
      if (shape instanceof Flatten.Arc) {
        return intersectArc2Circle(shape, this);
      }
      if (shape instanceof Flatten.Polygon) {
        return intersectCircle2Polygon(this, shape);
      }
    }
    distanceTo(shape) {
      if (shape instanceof Flatten.Point) {
        let [distance, shortest_segment] = Flatten.Distance.point2circle(shape, this);
        shortest_segment = shortest_segment.reverse();
        return [distance, shortest_segment];
      }
      if (shape instanceof Flatten.Circle) {
        let [distance, shortest_segment] = Flatten.Distance.circle2circle(this, shape);
        return [distance, shortest_segment];
      }
      if (shape instanceof Flatten.Line) {
        let [distance, shortest_segment] = Flatten.Distance.circle2line(this, shape);
        return [distance, shortest_segment];
      }
      if (shape instanceof Flatten.Segment) {
        let [distance, shortest_segment] = Flatten.Distance.segment2circle(shape, this);
        shortest_segment = shortest_segment.reverse();
        return [distance, shortest_segment];
      }
      if (shape instanceof Flatten.Arc) {
        let [distance, shortest_segment] = Flatten.Distance.arc2circle(shape, this);
        shortest_segment = shortest_segment.reverse();
        return [distance, shortest_segment];
      }
      if (shape instanceof Flatten.Polygon) {
        let [distance, shortest_segment] = Flatten.Distance.shape2polygon(this, shape);
        return [distance, shortest_segment];
      }
      if (shape instanceof Flatten.PlanarSet) {
        let [dist, shortest_segment] = Flatten.Distance.shape2planarSet(this, shape);
        return [dist, shortest_segment];
      }
    }
    toJSON() {
      return Object.assign({}, this, { name: "circle" });
    }
    svg(attrs = {}) {
      let { stroke, strokeWidth, fill, fillOpacity, id, className } = attrs;
      let id_str = id && id.length > 0 ? `id="${id}"` : "";
      let class_str = className && className.length > 0 ? `class="${className}"` : "";
      return `
<circle cx="${this.pc.x}" cy="${this.pc.y}" r="${this.r}" stroke="${stroke || "black"}" stroke-width="${strokeWidth || 1}" fill="${fill || "none"}" fill-opacity="${fillOpacity || 1}" ${id_str} ${class_str} />`;
    }
  };
  Flatten.Circle = Circle;
  var circle = (...args) => new Flatten.Circle(...args);
  Flatten.circle = circle;
  var Arc = class {
    constructor(...args) {
      this.pc = new Flatten.Point();
      this.r = 1;
      this.startAngle = 0;
      this.endAngle = 2 * Math.PI;
      this.counterClockwise = Flatten.CCW;
      if (args.length == 0)
        return;
      if (args.length == 1 && args[0] instanceof Object && args[0].name === "arc") {
        let { pc, r, startAngle, endAngle, counterClockwise } = args[0];
        this.pc = new Flatten.Point(pc.x, pc.y);
        this.r = r;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.counterClockwise = counterClockwise;
        return;
      } else {
        let [pc, r, startAngle, endAngle, counterClockwise] = [...args];
        if (pc && pc instanceof Flatten.Point)
          this.pc = pc.clone();
        if (r !== void 0)
          this.r = r;
        if (startAngle !== void 0)
          this.startAngle = startAngle;
        if (endAngle !== void 0)
          this.endAngle = endAngle;
        if (counterClockwise !== void 0)
          this.counterClockwise = counterClockwise;
        return;
      }
      throw Flatten.Errors.ILLEGAL_PARAMETERS;
    }
    clone() {
      return new Flatten.Arc(this.pc.clone(), this.r, this.startAngle, this.endAngle, this.counterClockwise);
    }
    get sweep() {
      if (Flatten.Utils.EQ(this.startAngle, this.endAngle))
        return 0;
      if (Flatten.Utils.EQ(Math.abs(this.startAngle - this.endAngle), Flatten.PIx2)) {
        return Flatten.PIx2;
      }
      let sweep;
      if (this.counterClockwise) {
        sweep = Flatten.Utils.GT(this.endAngle, this.startAngle) ? this.endAngle - this.startAngle : this.endAngle - this.startAngle + Flatten.PIx2;
      } else {
        sweep = Flatten.Utils.GT(this.startAngle, this.endAngle) ? this.startAngle - this.endAngle : this.startAngle - this.endAngle + Flatten.PIx2;
      }
      if (Flatten.Utils.GT(sweep, Flatten.PIx2)) {
        sweep -= Flatten.PIx2;
      }
      if (Flatten.Utils.LT(sweep, 0)) {
        sweep += Flatten.PIx2;
      }
      return sweep;
    }
    get start() {
      let p0 = new Flatten.Point(this.pc.x + this.r, this.pc.y);
      return p0.rotate(this.startAngle, this.pc);
    }
    get end() {
      let p0 = new Flatten.Point(this.pc.x + this.r, this.pc.y);
      return p0.rotate(this.endAngle, this.pc);
    }
    get center() {
      return this.pc.clone();
    }
    get vertices() {
      return [this.start.clone(), this.end.clone()];
    }
    get length() {
      return Math.abs(this.sweep * this.r);
    }
    get box() {
      let func_arcs = this.breakToFunctional();
      let box2 = func_arcs.reduce((acc, arc2) => acc.merge(arc2.start.box), new Flatten.Box());
      box2 = box2.merge(this.end.box);
      return box2;
    }
    contains(pt) {
      if (!Flatten.Utils.EQ(this.pc.distanceTo(pt)[0], this.r))
        return false;
      if (pt.equalTo(this.start))
        return true;
      let angle = new Flatten.Vector(this.pc, pt).slope;
      let test_arc = new Flatten.Arc(this.pc, this.r, this.startAngle, angle, this.counterClockwise);
      return Flatten.Utils.LE(test_arc.length, this.length);
    }
    split(pt) {
      if (this.start.equalTo(pt))
        return [null, this.clone()];
      if (this.end.equalTo(pt))
        return [this.clone(), null];
      let angle = new Flatten.Vector(this.pc, pt).slope;
      return [
        new Flatten.Arc(this.pc, this.r, this.startAngle, angle, this.counterClockwise),
        new Flatten.Arc(this.pc, this.r, angle, this.endAngle, this.counterClockwise)
      ];
    }
    middle() {
      let endAngle = this.counterClockwise ? this.startAngle + this.sweep / 2 : this.startAngle - this.sweep / 2;
      let arc2 = new Flatten.Arc(this.pc, this.r, this.startAngle, endAngle, this.counterClockwise);
      return arc2.end;
    }
    pointAtLength(length) {
      if (length > this.length || length < 0)
        return null;
      if (length == 0)
        return this.start;
      if (length == this.length)
        return this.end;
      let factor = length / this.length;
      let endAngle = this.counterClockwise ? this.startAngle + this.sweep * factor : this.startAngle - this.sweep * factor;
      let arc2 = new Flatten.Arc(this.pc, this.r, this.startAngle, endAngle, this.counterClockwise);
      return arc2.end;
    }
    chordHeight() {
      return (1 - Math.cos(Math.abs(this.sweep / 2))) * this.r;
    }
    intersect(shape) {
      if (shape instanceof Flatten.Point) {
        return this.contains(shape) ? [shape] : [];
      }
      if (shape instanceof Flatten.Line) {
        return intersectLine2Arc(shape, this);
      }
      if (shape instanceof Flatten.Circle) {
        return intersectArc2Circle(this, shape);
      }
      if (shape instanceof Flatten.Segment) {
        return intersectSegment2Arc(shape, this);
      }
      if (shape instanceof Flatten.Box) {
        return intersectArc2Box(this, shape);
      }
      if (shape instanceof Flatten.Arc) {
        return intersectArc2Arc(this, shape);
      }
      if (shape instanceof Flatten.Polygon) {
        return intersectArc2Polygon(this, shape);
      }
    }
    distanceTo(shape) {
      if (shape instanceof Flatten.Point) {
        let [dist, shortest_segment] = Flatten.Distance.point2arc(shape, this);
        shortest_segment = shortest_segment.reverse();
        return [dist, shortest_segment];
      }
      if (shape instanceof Flatten.Circle) {
        let [dist, shortest_segment] = Flatten.Distance.arc2circle(this, shape);
        return [dist, shortest_segment];
      }
      if (shape instanceof Flatten.Line) {
        let [dist, shortest_segment] = Flatten.Distance.arc2line(this, shape);
        return [dist, shortest_segment];
      }
      if (shape instanceof Flatten.Segment) {
        let [dist, shortest_segment] = Flatten.Distance.segment2arc(shape, this);
        shortest_segment = shortest_segment.reverse();
        return [dist, shortest_segment];
      }
      if (shape instanceof Flatten.Arc) {
        let [dist, shortest_segment] = Flatten.Distance.arc2arc(this, shape);
        return [dist, shortest_segment];
      }
      if (shape instanceof Flatten.Polygon) {
        let [dist, shortest_segment] = Flatten.Distance.shape2polygon(this, shape);
        return [dist, shortest_segment];
      }
      if (shape instanceof Flatten.PlanarSet) {
        let [dist, shortest_segment] = Flatten.Distance.shape2planarSet(this, shape);
        return [dist, shortest_segment];
      }
    }
    breakToFunctional() {
      let func_arcs_array = [];
      let angles = [0, Math.PI / 2, 2 * Math.PI / 2, 3 * Math.PI / 2];
      let pts = [
        this.pc.translate(this.r, 0),
        this.pc.translate(0, this.r),
        this.pc.translate(-this.r, 0),
        this.pc.translate(0, -this.r)
      ];
      let test_arcs = [];
      for (let i = 0; i < 4; i++) {
        if (pts[i].on(this)) {
          test_arcs.push(new Flatten.Arc(this.pc, this.r, this.startAngle, angles[i], this.counterClockwise));
        }
      }
      if (test_arcs.length == 0) {
        func_arcs_array.push(this.clone());
      } else {
        test_arcs.sort((arc1, arc2) => arc1.length - arc2.length);
        for (let i = 0; i < test_arcs.length; i++) {
          let prev_arc2 = func_arcs_array.length > 0 ? func_arcs_array[func_arcs_array.length - 1] : void 0;
          let new_arc2;
          if (prev_arc2) {
            new_arc2 = new Flatten.Arc(this.pc, this.r, prev_arc2.endAngle, test_arcs[i].endAngle, this.counterClockwise);
          } else {
            new_arc2 = new Flatten.Arc(this.pc, this.r, this.startAngle, test_arcs[i].endAngle, this.counterClockwise);
          }
          if (!Flatten.Utils.EQ_0(new_arc2.length)) {
            func_arcs_array.push(new_arc2.clone());
          }
        }
        let prev_arc = func_arcs_array.length > 0 ? func_arcs_array[func_arcs_array.length - 1] : void 0;
        let new_arc;
        if (prev_arc) {
          new_arc = new Flatten.Arc(this.pc, this.r, prev_arc.endAngle, this.endAngle, this.counterClockwise);
        } else {
          new_arc = new Flatten.Arc(this.pc, this.r, this.startAngle, this.endAngle, this.counterClockwise);
        }
        if (!Flatten.Utils.EQ_0(new_arc.length) && !Flatten.Utils.EQ(new_arc.sweep, 2 * Math.PI)) {
          func_arcs_array.push(new_arc.clone());
        }
      }
      return func_arcs_array;
    }
    tangentInStart() {
      let vec = new Flatten.Vector(this.pc, this.start);
      let angle = this.counterClockwise ? Math.PI / 2 : -Math.PI / 2;
      let tangent = vec.rotate(angle).normalize();
      return tangent;
    }
    tangentInEnd() {
      let vec = new Flatten.Vector(this.pc, this.end);
      let angle = this.counterClockwise ? -Math.PI / 2 : Math.PI / 2;
      let tangent = vec.rotate(angle).normalize();
      return tangent;
    }
    reverse() {
      return new Flatten.Arc(this.pc, this.r, this.endAngle, this.startAngle, !this.counterClockwise);
    }
    translate(...args) {
      let arc2 = this.clone();
      arc2.pc = this.pc.translate(...args);
      return arc2;
    }
    rotate(angle = 0, center = new Flatten.Point()) {
      let m = new Flatten.Matrix();
      m = m.translate(center.x, center.y).rotate(angle).translate(-center.x, -center.y);
      return this.transform(m);
    }
    scale(scaleX = 1, scaleY = 1) {
      let m = new Flatten.Matrix();
      m = m.scale(scaleX, scaleY);
      return this.transform(m);
    }
    transform(matrix2 = new Flatten.Matrix()) {
      let newStart = this.start.transform(matrix2);
      let newEnd = this.end.transform(matrix2);
      let newCenter = this.pc.transform(matrix2);
      let newDirection = this.counterClockwise;
      if (matrix2.a * matrix2.d < 0) {
        newDirection = !newDirection;
      }
      let arc2 = Flatten.Arc.arcSE(newCenter, newStart, newEnd, newDirection);
      return arc2;
    }
    static arcSE(center, start, end, counterClockwise) {
      let { vector: vector2 } = Flatten;
      let startAngle = vector2(center, start).slope;
      let endAngle = vector2(center, end).slope;
      if (Flatten.Utils.EQ(startAngle, endAngle)) {
        endAngle += 2 * Math.PI;
        counterClockwise = true;
      }
      let r = vector2(center, start).length;
      return new Flatten.Arc(center, r, startAngle, endAngle, counterClockwise);
    }
    definiteIntegral(ymin = 0) {
      let f_arcs = this.breakToFunctional();
      let area = f_arcs.reduce((acc, arc2) => acc + arc2.circularSegmentDefiniteIntegral(ymin), 0);
      return area;
    }
    circularSegmentDefiniteIntegral(ymin) {
      let line2 = new Flatten.Line(this.start, this.end);
      let onLeftSide = this.pc.leftTo(line2);
      let segment2 = new Flatten.Segment(this.start, this.end);
      let areaTrapez = segment2.definiteIntegral(ymin);
      let areaCircularSegment = this.circularSegmentArea();
      let area = onLeftSide ? areaTrapez - areaCircularSegment : areaTrapez + areaCircularSegment;
      return area;
    }
    circularSegmentArea() {
      return 0.5 * this.r * this.r * (this.sweep - Math.sin(this.sweep));
    }
    sortPoints(pts) {
      let { vector: vector2 } = Flatten;
      return pts.slice().sort((pt1, pt2) => {
        let slope1 = vector2(this.pc, pt1).slope;
        let slope2 = vector2(this.pc, pt2).slope;
        if (slope1 < slope2) {
          return -1;
        }
        if (slope1 > slope2) {
          return 1;
        }
        return 0;
      });
    }
    toJSON() {
      return Object.assign({}, this, { name: "arc" });
    }
    svg(attrs = {}) {
      let largeArcFlag = this.sweep <= Math.PI ? "0" : "1";
      let sweepFlag = this.counterClockwise ? "1" : "0";
      let { stroke, strokeWidth, fill, id, className } = attrs;
      let id_str = id && id.length > 0 ? `id="${id}"` : "";
      let class_str = className && className.length > 0 ? `class="${className}"` : "";
      if (Flatten.Utils.EQ(this.sweep, 2 * Math.PI)) {
        let circle2 = new Flatten.Circle(this.pc, this.r);
        return circle2.svg(attrs);
      } else {
        return `
<path d="M${this.start.x},${this.start.y}
                             A${this.r},${this.r} 0 ${largeArcFlag},${sweepFlag} ${this.end.x},${this.end.y}"
                    stroke="${stroke || "black"}" stroke-width="${strokeWidth || 1}" fill="${fill || "none"}" ${id_str} ${class_str} />`;
      }
    }
  };
  Flatten.Arc = Arc;
  var arc = (...args) => new Flatten.Arc(...args);
  Flatten.arc = arc;
  var Box = class {
    constructor(xmin = void 0, ymin = void 0, xmax = void 0, ymax = void 0) {
      this.xmin = xmin;
      this.ymin = ymin;
      this.xmax = xmax;
      this.ymax = ymax;
    }
    clone() {
      return new Box(this.xmin, this.ymin, this.xmax, this.ymax);
    }
    get low() {
      return new Flatten.Point(this.xmin, this.ymin);
    }
    get high() {
      return new Flatten.Point(this.xmax, this.ymax);
    }
    get max() {
      return this.clone();
    }
    get center() {
      return new Flatten.Point((this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2);
    }
    get box() {
      return this.clone();
    }
    not_intersect(other_box) {
      return this.xmax < other_box.xmin || this.xmin > other_box.xmax || this.ymax < other_box.ymin || this.ymin > other_box.ymax;
    }
    intersect(other_box) {
      return !this.not_intersect(other_box);
    }
    merge(other_box) {
      return new Box(this.xmin === void 0 ? other_box.xmin : Math.min(this.xmin, other_box.xmin), this.ymin === void 0 ? other_box.ymin : Math.min(this.ymin, other_box.ymin), this.xmax === void 0 ? other_box.xmax : Math.max(this.xmax, other_box.xmax), this.ymax === void 0 ? other_box.ymax : Math.max(this.ymax, other_box.ymax));
    }
    less_than(other_box) {
      if (this.low.lessThan(other_box.low))
        return true;
      if (this.low.equalTo(other_box.low) && this.high.lessThan(other_box.high))
        return true;
      return false;
    }
    equal_to(other_box) {
      return this.low.equalTo(other_box.low) && this.high.equalTo(other_box.high);
    }
    output() {
      return this.clone();
    }
    static comparable_max(box1, box2) {
      return box1.merge(box2);
    }
    static comparable_less_than(pt1, pt2) {
      return pt1.lessThan(pt2);
    }
    set(xmin, ymin, xmax, ymax) {
      this.xmin = xmin;
      this.ymin = ymin;
      this.xmax = xmax;
      this.ymax = ymax;
    }
    toPoints() {
      return [
        new Flatten.Point(this.xmin, this.ymin),
        new Flatten.Point(this.xmax, this.ymin),
        new Flatten.Point(this.xmax, this.ymax),
        new Flatten.Point(this.xmin, this.ymax)
      ];
    }
    toSegments() {
      let pts = this.toPoints();
      return [
        new Flatten.Segment(pts[0], pts[1]),
        new Flatten.Segment(pts[1], pts[2]),
        new Flatten.Segment(pts[2], pts[3]),
        new Flatten.Segment(pts[3], pts[0])
      ];
    }
    svg(attrs = {}) {
      let { stroke, strokeWidth, fill, id, className } = attrs;
      let id_str = id && id.length > 0 ? `id="${id}"` : "";
      let class_str = className && className.length > 0 ? `class="${className}"` : "";
      let width = this.xmax - this.xmin;
      let height = this.ymax - this.ymin;
      return `
<rect x="${this.xmin}" y="${this.ymin}" width=${width} height=${height} stroke="${stroke || "black"}" stroke-width="${strokeWidth || 1}" fill="${fill || "none"}" ${id_str} ${class_str} />`;
    }
  };
  Flatten.Box = Box;
  var box = (...args) => new Flatten.Box(...args);
  Flatten.box = box;
  var Edge = class {
    constructor(shape) {
      this.shape = shape;
      this.next = void 0;
      this.prev = void 0;
      this.face = void 0;
      this.arc_length = 0;
      this.bvStart = void 0;
      this.bvEnd = void 0;
      this.bv = void 0;
      this.overlap = void 0;
    }
    get start() {
      return this.shape.start;
    }
    get end() {
      return this.shape.end;
    }
    get length() {
      return this.shape.length;
    }
    get box() {
      return this.shape.box;
    }
    isSegment() {
      return this.shape instanceof Flatten.Segment;
    }
    isArc() {
      return this.shape instanceof Flatten.Arc;
    }
    middle() {
      return this.shape.middle();
    }
    pointAtLength(length) {
      return this.shape.pointAtLength(length);
    }
    contains(pt) {
      return this.shape.contains(pt);
    }
    setInclusion(polygon2) {
      if (this.bv !== void 0)
        return this.bv;
      if (this.shape instanceof Flatten.Line || this.shape instanceof Flatten.Ray) {
        this.bv = Flatten.OUTSIDE;
        return this.bv;
      }
      if (this.bvStart === void 0) {
        this.bvStart = ray_shoot(polygon2, this.start);
      }
      if (this.bvEnd === void 0) {
        this.bvEnd = ray_shoot(polygon2, this.end);
      }
      if (this.bvStart === Flatten.OUTSIDE || this.bvEnd == Flatten.OUTSIDE) {
        this.bv = Flatten.OUTSIDE;
      } else if (this.bvStart === Flatten.INSIDE || this.bvEnd == Flatten.INSIDE) {
        this.bv = Flatten.INSIDE;
      } else {
        let bvMiddle = ray_shoot(polygon2, this.middle());
        this.bv = bvMiddle;
      }
      return this.bv;
    }
    setOverlap(edge) {
      let flag = void 0;
      let shape1 = this.shape;
      let shape2 = edge.shape;
      if (shape1 instanceof Flatten.Segment && shape2 instanceof Flatten.Segment) {
        if (shape1.start.equalTo(shape2.start) && shape1.end.equalTo(shape2.end)) {
          flag = Flatten.OVERLAP_SAME;
        } else if (shape1.start.equalTo(shape2.end) && shape1.end.equalTo(shape2.start)) {
          flag = Flatten.OVERLAP_OPPOSITE;
        }
      } else if (shape1 instanceof Flatten.Arc && shape2 instanceof Flatten.Arc) {
        if (shape1.start.equalTo(shape2.start) && shape1.end.equalTo(shape2.end) && shape1.middle().equalTo(shape2.middle())) {
          flag = Flatten.OVERLAP_SAME;
        } else if (shape1.start.equalTo(shape2.end) && shape1.end.equalTo(shape2.start) && shape1.middle().equalTo(shape2.middle())) {
          flag = Flatten.OVERLAP_OPPOSITE;
        }
      } else if (shape1 instanceof Flatten.Segment && shape2 instanceof Flatten.Arc || shape1 instanceof Flatten.Arc && shape2 instanceof Flatten.Segment) {
        if (shape1.start.equalTo(shape2.start) && shape1.end.equalTo(shape2.end) && shape1.middle().equalTo(shape2.middle())) {
          flag = Flatten.OVERLAP_SAME;
        } else if (shape1.start.equalTo(shape2.end) && shape1.end.equalTo(shape2.start) && shape1.middle().equalTo(shape2.middle())) {
          flag = Flatten.OVERLAP_OPPOSITE;
        }
      }
      if (this.overlap === void 0)
        this.overlap = flag;
      if (edge.overlap === void 0)
        edge.overlap = flag;
    }
    svg() {
      if (this.shape instanceof Flatten.Segment) {
        return ` L${this.shape.end.x},${this.shape.end.y}`;
      } else if (this.shape instanceof Flatten.Arc) {
        let arc2 = this.shape;
        let largeArcFlag;
        let sweepFlag = arc2.counterClockwise ? "1" : "0";
        if (Flatten.Utils.EQ(arc2.sweep, 2 * Math.PI)) {
          let sign = arc2.counterClockwise ? 1 : -1;
          let halfArc1 = new Flatten.Arc(arc2.pc, arc2.r, arc2.startAngle, arc2.startAngle + sign * Math.PI, arc2.counterClockwise);
          let halfArc2 = new Flatten.Arc(arc2.pc, arc2.r, arc2.startAngle + sign * Math.PI, arc2.endAngle, arc2.counterClockwise);
          largeArcFlag = "0";
          return ` A${halfArc1.r},${halfArc1.r} 0 ${largeArcFlag},${sweepFlag} ${halfArc1.end.x},${halfArc1.end.y}
                    A${halfArc2.r},${halfArc2.r} 0 ${largeArcFlag},${sweepFlag} ${halfArc2.end.x},${halfArc2.end.y}`;
        } else {
          largeArcFlag = arc2.sweep <= Math.PI ? "0" : "1";
          return ` A${arc2.r},${arc2.r} 0 ${largeArcFlag},${sweepFlag} ${arc2.end.x},${arc2.end.y}`;
        }
      }
    }
    toJSON() {
      return this.shape.toJSON();
    }
  };
  Flatten.Edge = Edge;
  var CircularLinkedList = class extends LinkedList {
    constructor(first, last) {
      super(first, last);
      this.setCircularLinks();
    }
    setCircularLinks() {
      if (this.isEmpty())
        return;
      this.last.next = this.first;
      this.first.prev = this.last;
    }
    [Symbol.iterator]() {
      let element = void 0;
      return {
        next: () => {
          let value = element ? element : this.first;
          let done = this.first ? element ? element === this.first : false : true;
          element = value ? value.next : void 0;
          return { value, done };
        }
      };
    }
    append(element) {
      super.append(element);
      this.setCircularLinks();
      return this;
    }
    insert(newElement, elementBefore) {
      super.insert(newElement, elementBefore);
      this.setCircularLinks();
      return this;
    }
    remove(element) {
      super.remove(element);
      return this;
    }
  };
  var Face = class extends CircularLinkedList {
    constructor(polygon2, ...args) {
      super();
      this._box = void 0;
      this._orientation = void 0;
      if (args.length == 0) {
        return;
      }
      if (args.length == 1) {
        if (args[0] instanceof Array) {
          let shapes = args[0];
          if (shapes.length == 0)
            return;
          if (shapes.every((shape) => {
            return shape instanceof Flatten.Point;
          })) {
            let segments = Face.points2segments(shapes);
            this.shapes2face(polygon2.edges, segments);
          } else if (shapes.every((shape) => {
            return shape instanceof Array && shape.length === 2;
          })) {
            let points = shapes.map((shape) => new Flatten.Point(shape[0], shape[1]));
            let segments = Face.points2segments(points);
            this.shapes2face(polygon2.edges, segments);
          } else if (shapes.every((shape) => {
            return shape instanceof Flatten.Segment || shape instanceof Flatten.Arc;
          })) {
            this.shapes2face(polygon2.edges, shapes);
          } else if (shapes.every((shape) => {
            return shape.name === "segment" || shape.name === "arc";
          })) {
            let flattenShapes = [];
            for (let shape of shapes) {
              let flattenShape;
              if (shape.name === "segment") {
                flattenShape = new Flatten.Segment(shape);
              } else {
                flattenShape = new Flatten.Arc(shape);
              }
              flattenShapes.push(flattenShape);
            }
            this.shapes2face(polygon2.edges, flattenShapes);
          }
        } else if (args[0] instanceof Face) {
          let face = args[0];
          this.first = face.first;
          this.last = face.last;
          for (let edge of face) {
            polygon2.edges.add(edge);
          }
        } else if (args[0] instanceof Flatten.Circle) {
          this.shapes2face(polygon2.edges, [args[0].toArc(Flatten.CCW)]);
        } else if (args[0] instanceof Flatten.Box) {
          let box2 = args[0];
          this.shapes2face(polygon2.edges, [
            new Flatten.Segment(new Flatten.Point(box2.xmin, box2.ymin), new Flatten.Point(box2.xmax, box2.ymin)),
            new Flatten.Segment(new Flatten.Point(box2.xmax, box2.ymin), new Flatten.Point(box2.xmax, box2.ymax)),
            new Flatten.Segment(new Flatten.Point(box2.xmax, box2.ymax), new Flatten.Point(box2.xmin, box2.ymax)),
            new Flatten.Segment(new Flatten.Point(box2.xmin, box2.ymax), new Flatten.Point(box2.xmin, box2.ymin))
          ]);
        }
      }
      if (args.length == 2 && args[0] instanceof Flatten.Edge && args[1] instanceof Flatten.Edge) {
        this.first = args[0];
        this.last = args[1];
        this.last.next = this.first;
        this.first.prev = this.last;
        this.setArcLength();
      }
    }
    get edges() {
      return this.toArray();
    }
    get shapes() {
      return this.edges.map((edge) => edge.shape.clone());
    }
    get box() {
      if (this._box === void 0) {
        let box2 = new Flatten.Box();
        for (let edge of this) {
          box2 = box2.merge(edge.box);
        }
        this._box = box2;
      }
      return this._box;
    }
    get perimeter() {
      return this.last.arc_length + this.last.length;
    }
    pointAtLength(length) {
      if (length > this.perimeter || length < 0)
        return null;
      let point2 = null;
      for (let edge of this) {
        if (length >= edge.arc_length && (edge === this.last || length < edge.next.arc_length)) {
          point2 = edge.pointAtLength(length - edge.arc_length);
          break;
        }
      }
      return point2;
    }
    static points2segments(points) {
      let segments = [];
      for (let i = 0; i < points.length; i++) {
        if (points[i].equalTo(points[(i + 1) % points.length]))
          continue;
        segments.push(new Flatten.Segment(points[i], points[(i + 1) % points.length]));
      }
      return segments;
    }
    shapes2face(edges, shapes) {
      for (let shape of shapes) {
        let edge = new Flatten.Edge(shape);
        this.append(edge);
        edges.add(edge);
      }
    }
    append(edge) {
      super.append(edge);
      this.setOneEdgeArcLength(edge);
      edge.face = this;
      return this;
    }
    insert(newEdge, edgeBefore) {
      super.insert(newEdge, edgeBefore);
      this.setOneEdgeArcLength(newEdge);
      newEdge.face = this;
      return this;
    }
    remove(edge) {
      super.remove(edge);
      this.setArcLength();
      return this;
    }
    reverse() {
      let edges = [];
      let edge_tmp = this.last;
      do {
        edge_tmp.shape = edge_tmp.shape.reverse();
        edges.push(edge_tmp);
        edge_tmp = edge_tmp.prev;
      } while (edge_tmp !== this.last);
      this.first = void 0;
      this.last = void 0;
      for (let edge of edges) {
        if (this.first === void 0) {
          edge.prev = edge;
          edge.next = edge;
          this.first = edge;
          this.last = edge;
        } else {
          edge.prev = this.last;
          this.last.next = edge;
          this.last = edge;
          this.last.next = this.first;
          this.first.prev = this.last;
        }
        this.setOneEdgeArcLength(edge);
      }
      if (this._orientation !== void 0) {
        this._orientation = void 0;
        this._orientation = this.orientation();
      }
    }
    setArcLength() {
      for (let edge of this) {
        this.setOneEdgeArcLength(edge);
        edge.face = this;
      }
    }
    setOneEdgeArcLength(edge) {
      if (edge === this.first) {
        edge.arc_length = 0;
      } else {
        edge.arc_length = edge.prev.arc_length + edge.prev.length;
      }
    }
    area() {
      return Math.abs(this.signedArea());
    }
    signedArea() {
      let sArea = 0;
      let ymin = this.box.ymin;
      for (let edge of this) {
        sArea += edge.shape.definiteIntegral(ymin);
      }
      return sArea;
    }
    orientation() {
      if (this._orientation === void 0) {
        let area = this.signedArea();
        if (Flatten.Utils.EQ_0(area)) {
          this._orientation = Flatten.ORIENTATION.NOT_ORIENTABLE;
        } else if (Flatten.Utils.LT(area, 0)) {
          this._orientation = Flatten.ORIENTATION.CCW;
        } else {
          this._orientation = Flatten.ORIENTATION.CW;
        }
      }
      return this._orientation;
    }
    isSimple(edges) {
      let ip = Face.getSelfIntersections(this, edges, true);
      return ip.length == 0;
    }
    static getSelfIntersections(face, edges, exitOnFirst = false) {
      let int_points = [];
      for (let edge1 of face) {
        let resp = edges.search(edge1.box);
        for (let edge2 of resp) {
          if (edge1 === edge2)
            continue;
          if (edge2.face !== face)
            continue;
          if (edge1.shape instanceof Flatten.Segment && edge2.shape instanceof Flatten.Segment && (edge1.next === edge2 || edge1.prev === edge2))
            continue;
          let ip = edge1.shape.intersect(edge2.shape);
          for (let pt of ip) {
            if (pt.equalTo(edge1.start) && pt.equalTo(edge2.end) && edge2 === edge1.prev)
              continue;
            if (pt.equalTo(edge1.end) && pt.equalTo(edge2.start) && edge2 === edge1.next)
              continue;
            int_points.push(pt);
            if (exitOnFirst)
              break;
          }
          if (int_points.length > 0 && exitOnFirst)
            break;
        }
        if (int_points.length > 0 && exitOnFirst)
          break;
      }
      return int_points;
    }
    findEdgeByPoint(pt) {
      let edgeFound;
      for (let edge of this) {
        if (edge.shape.contains(pt)) {
          edgeFound = edge;
          break;
        }
      }
      return edgeFound;
    }
    toPolygon() {
      return new Flatten.Polygon(this.shapes);
    }
    toJSON() {
      return this.edges.map((edge) => edge.toJSON());
    }
    svg() {
      let svgStr = `
M${this.first.start.x},${this.first.start.y}`;
      for (let edge of this) {
        svgStr += edge.svg();
      }
      svgStr += ` z`;
      return svgStr;
    }
  };
  Flatten.Face = Face;
  var Ray = class {
    constructor(...args) {
      this.pt = new Flatten.Point();
      this.norm = new Flatten.Vector(0, 1);
      if (args.length == 0) {
        return;
      }
      if (args.length >= 1 && args[0] instanceof Flatten.Point) {
        this.pt = args[0].clone();
      }
      if (args.length === 1) {
        return;
      }
      if (args.length === 2 && args[1] instanceof Flatten.Vector) {
        this.norm = args[1].clone();
        return;
      }
      throw Flatten.Errors.ILLEGAL_PARAMETERS;
    }
    clone() {
      return new Ray(this.pt, this.norm);
    }
    get slope() {
      let vec = new Flatten.Vector(this.norm.y, -this.norm.x);
      return vec.slope;
    }
    get box() {
      let slope = this.slope;
      return new Flatten.Box(slope > Math.PI / 2 && slope < 3 * Math.PI / 2 ? Number.NEGATIVE_INFINITY : this.pt.x, slope >= 0 && slope <= Math.PI ? this.pt.y : Number.NEGATIVE_INFINITY, slope >= Math.PI / 2 && slope <= 3 * Math.PI / 2 ? this.pt.x : Number.POSITIVE_INFINITY, slope >= Math.PI && slope <= 2 * Math.PI || slope == 0 ? this.pt.y : Number.POSITIVE_INFINITY);
    }
    get start() {
      return this.pt;
    }
    get end() {
      return void 0;
    }
    get length() {
      return Number.POSITIVE_INFINITY;
    }
    contains(pt) {
      if (this.pt.equalTo(pt)) {
        return true;
      }
      let vec = new Flatten.Vector(this.pt, pt);
      return Flatten.Utils.EQ_0(this.norm.dot(vec)) && Flatten.Utils.GE(vec.cross(this.norm), 0);
    }
    split(pt) {
      if (!this.contains(pt))
        return [];
      if (this.pt.equalTo(pt)) {
        return [this];
      }
      return [
        new Flatten.Segment(this.pt, pt),
        new Flatten.Ray(pt, this.norm)
      ];
    }
    intersect(shape) {
      if (shape instanceof Flatten.Segment) {
        return this.intersectRay2Segment(this, shape);
      }
      if (shape instanceof Flatten.Arc) {
        return this.intersectRay2Arc(this, shape);
      }
    }
    intersectRay2Segment(ray2, segment2) {
      let ip = [];
      let line2 = new Flatten.Line(ray2.start, ray2.norm);
      let ip_tmp = line2.intersect(segment2);
      for (let pt of ip_tmp) {
        if (ray2.contains(pt)) {
          ip.push(pt);
        }
      }
      if (ip_tmp.length == 2 && ip.length == 1 && ray2.start.on(line2)) {
        ip.push(ray2.start);
      }
      return ip;
    }
    intersectRay2Arc(ray2, arc2) {
      let ip = [];
      let line2 = new Flatten.Line(ray2.start, ray2.norm);
      let ip_tmp = line2.intersect(arc2);
      for (let pt of ip_tmp) {
        if (ray2.contains(pt)) {
          ip.push(pt);
        }
      }
      return ip;
    }
    svg(box2, attrs = {}) {
      let line2 = new Flatten.Line(this.pt, this.norm);
      let ip = intersectLine2Box(line2, box2);
      ip = ip.filter((pt) => this.contains(pt));
      if (ip.length === 0 || ip.length === 2)
        return "";
      let segment2 = new Flatten.Segment(this.pt, ip[0]);
      return segment2.svg(attrs);
    }
  };
  Flatten.Ray = Ray;
  var ray = (...args) => new Flatten.Ray(...args);
  Flatten.ray = ray;
  var Polygon = class {
    constructor() {
      this.faces = new Flatten.PlanarSet();
      this.edges = new Flatten.PlanarSet();
      let args = [...arguments];
      if (args.length === 1 && (args[0] instanceof Array && args[0].length > 0 || args[0] instanceof Flatten.Circle || args[0] instanceof Flatten.Box)) {
        let argsArray = args[0];
        if (args[0] instanceof Array && args[0].every((loop) => {
          return loop instanceof Array;
        })) {
          if (argsArray.every((el) => {
            return el instanceof Array && el.length === 2 && typeof el[0] === "number" && typeof el[1] === "number";
          })) {
            this.faces.add(new Flatten.Face(this, argsArray));
          } else {
            for (let loop of argsArray) {
              if (loop instanceof Array && loop[0] instanceof Array && loop[0].every((el) => {
                return el instanceof Array && el.length === 2 && typeof el[0] === "number" && typeof el[1] === "number";
              })) {
                for (let loop1 of loop) {
                  this.faces.add(new Flatten.Face(this, loop1));
                }
              } else {
                this.faces.add(new Flatten.Face(this, loop));
              }
            }
          }
        } else {
          this.faces.add(new Flatten.Face(this, argsArray));
        }
      }
    }
    get box() {
      return [...this.faces].reduce((acc, face) => acc.merge(face.box), new Flatten.Box());
    }
    get vertices() {
      return [...this.edges].map((edge) => edge.start);
    }
    clone() {
      let polygon2 = new Polygon();
      for (let face of this.faces) {
        polygon2.addFace(face.shapes);
      }
      return polygon2;
    }
    isEmpty() {
      return this.edges.size === 0;
    }
    isValid() {
      let valid = true;
      for (let face of this.faces) {
        if (!face.isSimple(this.edges)) {
          valid = false;
          break;
        }
      }
      return valid;
    }
    area() {
      let signedArea = [...this.faces].reduce((acc, face) => acc + face.signedArea(), 0);
      return Math.abs(signedArea);
    }
    addFace(...args) {
      let face = new Flatten.Face(this, ...args);
      this.faces.add(face);
      return face;
    }
    deleteFace(face) {
      for (let edge of face) {
        let deleted2 = this.edges.delete(edge);
      }
      let deleted = this.faces.delete(face);
      return deleted;
    }
    removeChain(face, edgeFrom, edgeTo) {
      if (edgeTo.next === edgeFrom) {
        this.deleteFace(face);
        return;
      }
      for (let edge = edgeFrom; edge !== edgeTo.next; edge = edge.next) {
        face.remove(edge);
        this.edges.delete(edge);
        if (face.isEmpty()) {
          this.deleteFace(face);
          break;
        }
      }
    }
    addVertex(pt, edge) {
      let shapes = edge.shape.split(pt);
      if (shapes[0] === null)
        return edge.prev;
      if (shapes[1] === null)
        return edge;
      let newEdge = new Flatten.Edge(shapes[0]);
      let edgeBefore = edge.prev;
      edge.face.insert(newEdge, edgeBefore);
      this.edges.delete(edge);
      this.edges.add(newEdge);
      edge.shape = shapes[1];
      this.edges.add(edge);
      return newEdge;
    }
    cut(multiline2) {
      let cutPolygons = [this.clone()];
      for (let edge of multiline2) {
        if (edge.setInclusion(this) !== Flatten.INSIDE)
          continue;
        let cut_edge_start = edge.shape.start;
        let cut_edge_end = edge.shape.end;
        let newCutPolygons = [];
        for (let polygon2 of cutPolygons) {
          if (polygon2.findEdgeByPoint(cut_edge_start) === void 0) {
            newCutPolygons.push(polygon2);
          } else {
            let [cutPoly1, cutPoly2] = polygon2.cutFace(cut_edge_start, cut_edge_end);
            newCutPolygons.push(cutPoly1, cutPoly2);
          }
        }
        cutPolygons = newCutPolygons;
      }
      return cutPolygons;
    }
    cutFace(pt1, pt2) {
      let edge1 = this.findEdgeByPoint(pt1);
      let edge2 = this.findEdgeByPoint(pt2);
      if (edge1.face != edge2.face)
        return;
      let edgeBefore1 = this.addVertex(pt1, edge1);
      edge2 = this.findEdgeByPoint(pt2);
      let edgeBefore2 = this.addVertex(pt2, edge2);
      let face = edgeBefore1.face;
      let newEdge1 = new Flatten.Edge(new Flatten.Segment(edgeBefore1.end, edgeBefore2.end));
      let newEdge2 = new Flatten.Edge(new Flatten.Segment(edgeBefore2.end, edgeBefore1.end));
      edgeBefore1.next.prev = newEdge2;
      newEdge2.next = edgeBefore1.next;
      edgeBefore1.next = newEdge1;
      newEdge1.prev = edgeBefore1;
      edgeBefore2.next.prev = newEdge1;
      newEdge1.next = edgeBefore2.next;
      edgeBefore2.next = newEdge2;
      newEdge2.prev = edgeBefore2;
      this.edges.add(newEdge1);
      this.edges.add(newEdge2);
      let face1 = this.addFace(newEdge1, edgeBefore1);
      let face2 = this.addFace(newEdge2, edgeBefore2);
      this.faces.delete(face);
      return [face1.toPolygon(), face2.toPolygon()];
    }
    findEdgeByPoint(pt) {
      let edge;
      for (let face of this.faces) {
        edge = face.findEdgeByPoint(pt);
        if (edge != void 0)
          break;
      }
      return edge;
    }
    splitToIslands() {
      let polygons = this.toArray();
      polygons.sort((polygon1, polygon2) => polygon2.area() - polygon1.area());
      let orientation = [...polygons[0].faces][0].orientation();
      let newPolygons = polygons.filter((polygon2) => [...polygon2.faces][0].orientation() === orientation);
      for (let polygon2 of polygons) {
        let face = [...polygon2.faces][0];
        if (face.orientation() === orientation)
          continue;
        for (let islandPolygon of newPolygons) {
          if (face.shapes.every((shape) => islandPolygon.contains(shape))) {
            islandPolygon.addFace(face.shapes);
            break;
          }
        }
      }
      return newPolygons;
    }
    reverse() {
      for (let face of this.faces) {
        face.reverse();
      }
      return this;
    }
    contains(shape) {
      if (shape instanceof Flatten.Point) {
        let rel = ray_shoot(this, shape);
        return rel === Flatten.INSIDE || rel === Flatten.BOUNDARY;
      } else {
        return cover(this, shape);
      }
    }
    distanceTo(shape) {
      if (shape instanceof Flatten.Point) {
        let [dist, shortest_segment] = Flatten.Distance.point2polygon(shape, this);
        shortest_segment = shortest_segment.reverse();
        return [dist, shortest_segment];
      }
      if (shape instanceof Flatten.Circle || shape instanceof Flatten.Line || shape instanceof Flatten.Segment || shape instanceof Flatten.Arc) {
        let [dist, shortest_segment] = Flatten.Distance.shape2polygon(shape, this);
        shortest_segment = shortest_segment.reverse();
        return [dist, shortest_segment];
      }
      if (shape instanceof Flatten.Polygon) {
        let min_dist_and_segment = [Number.POSITIVE_INFINITY, new Flatten.Segment()];
        let dist, shortest_segment;
        for (let edge of this.edges) {
          let min_stop = min_dist_and_segment[0];
          [dist, shortest_segment] = Flatten.Distance.shape2planarSet(edge.shape, shape.edges, min_stop);
          if (Flatten.Utils.LT(dist, min_stop)) {
            min_dist_and_segment = [dist, shortest_segment];
          }
        }
        return min_dist_and_segment;
      }
    }
    intersect(shape) {
      if (shape instanceof Flatten.Point) {
        return this.contains(shape) ? [shape] : [];
      }
      if (shape instanceof Flatten.Line) {
        return intersectLine2Polygon(shape, this);
      }
      if (shape instanceof Flatten.Circle) {
        return intersectCircle2Polygon(shape, this);
      }
      if (shape instanceof Flatten.Segment) {
        return intersectSegment2Polygon(shape, this);
      }
      if (shape instanceof Flatten.Arc) {
        return intersectArc2Polygon(shape, this);
      }
      if (shape instanceof Flatten.Polygon) {
        return intersectPolygon2Polygon(shape, this);
      }
    }
    translate(vec) {
      let newPolygon = new Polygon();
      for (let face of this.faces) {
        newPolygon.addFace(face.shapes.map((shape) => shape.translate(vec)));
      }
      return newPolygon;
    }
    rotate(angle = 0, center = new Flatten.Point()) {
      let newPolygon = new Polygon();
      for (let face of this.faces) {
        newPolygon.addFace(face.shapes.map((shape) => shape.rotate(angle, center)));
      }
      return newPolygon;
    }
    transform(matrix2 = new Flatten.Matrix()) {
      let newPolygon = new Polygon();
      for (let face of this.faces) {
        newPolygon.addFace(face.shapes.map((shape) => shape.transform(matrix2)));
      }
      return newPolygon;
    }
    toJSON() {
      return [...this.faces].map((face) => face.toJSON());
    }
    toArray() {
      return [...this.faces].map((face) => face.toPolygon());
    }
    svg(attrs = {}) {
      let { stroke, strokeWidth, fill, fillRule, fillOpacity, id, className } = attrs;
      let id_str = id && id.length > 0 ? `id="${id}"` : "";
      let class_str = className && className.length > 0 ? `class="${className}"` : "";
      let svgStr = `
<path stroke="${stroke || "black"}" stroke-width="${strokeWidth || 1}" fill="${fill || "lightcyan"}" fill-rule="${fillRule || "evenodd"}" fill-opacity="${fillOpacity || 1}" ${id_str} ${class_str} d="`;
      for (let face of this.faces) {
        svgStr += face.svg();
      }
      svgStr += `" >
</path>`;
      return svgStr;
    }
  };
  Flatten.Polygon = Polygon;
  var polygon = (...args) => new Flatten.Polygon(...args);
  Flatten.polygon = polygon;
  var Distance = class {
    static point2point(pt1, pt2) {
      return pt1.distanceTo(pt2);
    }
    static point2line(pt, line2) {
      let closest_point = pt.projectionOn(line2);
      let vec = new Flatten.Vector(pt, closest_point);
      return [vec.length, new Flatten.Segment(pt, closest_point)];
    }
    static point2circle(pt, circle2) {
      let [dist2center, shortest_dist] = pt.distanceTo(circle2.center);
      if (Flatten.Utils.EQ_0(dist2center)) {
        return [circle2.r, new Flatten.Segment(pt, circle2.toArc().start)];
      } else {
        let dist = Math.abs(dist2center - circle2.r);
        let v = new Flatten.Vector(circle2.pc, pt).normalize().multiply(circle2.r);
        let closest_point = circle2.pc.translate(v);
        return [dist, new Flatten.Segment(pt, closest_point)];
      }
    }
    static point2segment(pt, segment2) {
      if (segment2.start.equalTo(segment2.end)) {
        return Distance.point2point(pt, segment2.start);
      }
      let v_seg = new Flatten.Vector(segment2.start, segment2.end);
      let v_ps2pt = new Flatten.Vector(segment2.start, pt);
      let v_pe2pt = new Flatten.Vector(segment2.end, pt);
      let start_sp = v_seg.dot(v_ps2pt);
      let end_sp = -v_seg.dot(v_pe2pt);
      let dist;
      let closest_point;
      if (Flatten.Utils.GE(start_sp, 0) && Flatten.Utils.GE(end_sp, 0)) {
        let v_unit = segment2.tangentInStart();
        dist = Math.abs(v_unit.cross(v_ps2pt));
        closest_point = segment2.start.translate(v_unit.multiply(v_unit.dot(v_ps2pt)));
        return [dist, new Flatten.Segment(pt, closest_point)];
      } else if (start_sp < 0) {
        return pt.distanceTo(segment2.start);
      } else {
        return pt.distanceTo(segment2.end);
      }
    }
    static point2arc(pt, arc2) {
      let circle2 = new Flatten.Circle(arc2.pc, arc2.r);
      let dist_and_segment = [];
      let dist, shortest_segment;
      [dist, shortest_segment] = Distance.point2circle(pt, circle2);
      if (shortest_segment.end.on(arc2)) {
        dist_and_segment.push(Distance.point2circle(pt, circle2));
      }
      dist_and_segment.push(Distance.point2point(pt, arc2.start));
      dist_and_segment.push(Distance.point2point(pt, arc2.end));
      Distance.sort(dist_and_segment);
      return dist_and_segment[0];
    }
    static segment2line(seg, line2) {
      let ip = seg.intersect(line2);
      if (ip.length > 0) {
        return [0, new Flatten.Segment(ip[0], ip[0])];
      }
      let dist_and_segment = [];
      dist_and_segment.push(Distance.point2line(seg.start, line2));
      dist_and_segment.push(Distance.point2line(seg.end, line2));
      Distance.sort(dist_and_segment);
      return dist_and_segment[0];
    }
    static segment2segment(seg1, seg2) {
      let ip = intersectSegment2Segment(seg1, seg2);
      if (ip.length > 0) {
        return [0, new Flatten.Segment(ip[0], ip[0])];
      }
      let dist_and_segment = [];
      let dist_tmp, shortest_segment_tmp;
      [dist_tmp, shortest_segment_tmp] = Distance.point2segment(seg2.start, seg1);
      dist_and_segment.push([dist_tmp, shortest_segment_tmp.reverse()]);
      [dist_tmp, shortest_segment_tmp] = Distance.point2segment(seg2.end, seg1);
      dist_and_segment.push([dist_tmp, shortest_segment_tmp.reverse()]);
      dist_and_segment.push(Distance.point2segment(seg1.start, seg2));
      dist_and_segment.push(Distance.point2segment(seg1.end, seg2));
      Distance.sort(dist_and_segment);
      return dist_and_segment[0];
    }
    static segment2circle(seg, circle2) {
      let ip = seg.intersect(circle2);
      if (ip.length > 0) {
        return [0, new Flatten.Segment(ip[0], ip[0])];
      }
      let line2 = new Flatten.Line(seg.ps, seg.pe);
      let [dist, shortest_segment] = Distance.point2line(circle2.center, line2);
      if (Flatten.Utils.GE(dist, circle2.r) && shortest_segment.end.on(seg)) {
        return Distance.point2circle(shortest_segment.end, circle2);
      } else {
        let [dist_from_start, shortest_segment_from_start] = Distance.point2circle(seg.start, circle2);
        let [dist_from_end, shortest_segment_from_end] = Distance.point2circle(seg.end, circle2);
        return Flatten.Utils.LT(dist_from_start, dist_from_end) ? [dist_from_start, shortest_segment_from_start] : [dist_from_end, shortest_segment_from_end];
      }
    }
    static segment2arc(seg, arc2) {
      let ip = seg.intersect(arc2);
      if (ip.length > 0) {
        return [0, new Flatten.Segment(ip[0], ip[0])];
      }
      let line2 = new Flatten.Line(seg.ps, seg.pe);
      let circle2 = new Flatten.Circle(arc2.pc, arc2.r);
      let [dist_from_center, shortest_segment_from_center] = Distance.point2line(circle2.center, line2);
      if (Flatten.Utils.GE(dist_from_center, circle2.r) && shortest_segment_from_center.end.on(seg)) {
        let [dist_from_projection, shortest_segment_from_projection] = Distance.point2circle(shortest_segment_from_center.end, circle2);
        if (shortest_segment_from_projection.end.on(arc2)) {
          return [dist_from_projection, shortest_segment_from_projection];
        }
      }
      let dist_and_segment = [];
      dist_and_segment.push(Distance.point2arc(seg.start, arc2));
      dist_and_segment.push(Distance.point2arc(seg.end, arc2));
      let dist_tmp, segment_tmp;
      [dist_tmp, segment_tmp] = Distance.point2segment(arc2.start, seg);
      dist_and_segment.push([dist_tmp, segment_tmp.reverse()]);
      [dist_tmp, segment_tmp] = Distance.point2segment(arc2.end, seg);
      dist_and_segment.push([dist_tmp, segment_tmp.reverse()]);
      Distance.sort(dist_and_segment);
      return dist_and_segment[0];
    }
    static circle2circle(circle1, circle2) {
      let ip = circle1.intersect(circle2);
      if (ip.length > 0) {
        return [0, new Flatten.Segment(ip[0], ip[0])];
      }
      if (circle1.center.equalTo(circle2.center)) {
        let arc1 = circle1.toArc();
        let arc2 = circle2.toArc();
        return Distance.point2point(arc1.start, arc2.start);
      } else {
        let line2 = new Flatten.Line(circle1.center, circle2.center);
        let ip1 = line2.intersect(circle1);
        let ip2 = line2.intersect(circle2);
        let dist_and_segment = [];
        dist_and_segment.push(Distance.point2point(ip1[0], ip2[0]));
        dist_and_segment.push(Distance.point2point(ip1[0], ip2[1]));
        dist_and_segment.push(Distance.point2point(ip1[1], ip2[0]));
        dist_and_segment.push(Distance.point2point(ip1[1], ip2[1]));
        Distance.sort(dist_and_segment);
        return dist_and_segment[0];
      }
    }
    static circle2line(circle2, line2) {
      let ip = circle2.intersect(line2);
      if (ip.length > 0) {
        return [0, new Flatten.Segment(ip[0], ip[0])];
      }
      let [dist_from_center, shortest_segment_from_center] = Distance.point2line(circle2.center, line2);
      let [dist, shortest_segment] = Distance.point2circle(shortest_segment_from_center.end, circle2);
      shortest_segment = shortest_segment.reverse();
      return [dist, shortest_segment];
    }
    static arc2line(arc2, line2) {
      let ip = line2.intersect(arc2);
      if (ip.length > 0) {
        return [0, new Flatten.Segment(ip[0], ip[0])];
      }
      let circle2 = new Flatten.Circle(arc2.center, arc2.r);
      let [dist_from_center, shortest_segment_from_center] = Distance.point2line(circle2.center, line2);
      if (Flatten.Utils.GE(dist_from_center, circle2.r)) {
        let [dist_from_projection, shortest_segment_from_projection] = Distance.point2circle(shortest_segment_from_center.end, circle2);
        if (shortest_segment_from_projection.end.on(arc2)) {
          return [dist_from_projection, shortest_segment_from_projection];
        }
      } else {
        let dist_and_segment = [];
        dist_and_segment.push(Distance.point2line(arc2.start, line2));
        dist_and_segment.push(Distance.point2line(arc2.end, line2));
        Distance.sort(dist_and_segment);
        return dist_and_segment[0];
      }
    }
    static arc2circle(arc2, circle2) {
      let ip = arc2.intersect(circle2);
      if (ip.length > 0) {
        return [0, new Flatten.Segment(ip[0], ip[0])];
      }
      let circle1 = new Flatten.Circle(arc2.center, arc2.r);
      let [dist, shortest_segment] = Distance.circle2circle(circle1, circle2);
      if (shortest_segment.start.on(arc2)) {
        return [dist, shortest_segment];
      } else {
        let dist_and_segment = [];
        dist_and_segment.push(Distance.point2circle(arc2.start, circle2));
        dist_and_segment.push(Distance.point2circle(arc2.end, circle2));
        Distance.sort(dist_and_segment);
        return dist_and_segment[0];
      }
    }
    static arc2arc(arc1, arc2) {
      let ip = arc1.intersect(arc2);
      if (ip.length > 0) {
        return [0, new Flatten.Segment(ip[0], ip[0])];
      }
      let circle1 = new Flatten.Circle(arc1.center, arc1.r);
      let circle2 = new Flatten.Circle(arc2.center, arc2.r);
      let [dist, shortest_segment] = Distance.circle2circle(circle1, circle2);
      if (shortest_segment.start.on(arc1) && shortest_segment.end.on(arc2)) {
        return [dist, shortest_segment];
      } else {
        let dist_and_segment = [];
        let dist_tmp, segment_tmp;
        [dist_tmp, segment_tmp] = Distance.point2arc(arc1.start, arc2);
        if (segment_tmp.end.on(arc2)) {
          dist_and_segment.push([dist_tmp, segment_tmp]);
        }
        [dist_tmp, segment_tmp] = Distance.point2arc(arc1.end, arc2);
        if (segment_tmp.end.on(arc2)) {
          dist_and_segment.push([dist_tmp, segment_tmp]);
        }
        [dist_tmp, segment_tmp] = Distance.point2arc(arc2.start, arc1);
        if (segment_tmp.end.on(arc1)) {
          dist_and_segment.push([dist_tmp, segment_tmp.reverse()]);
        }
        [dist_tmp, segment_tmp] = Distance.point2arc(arc2.end, arc1);
        if (segment_tmp.end.on(arc1)) {
          dist_and_segment.push([dist_tmp, segment_tmp.reverse()]);
        }
        [dist_tmp, segment_tmp] = Distance.point2point(arc1.start, arc2.start);
        dist_and_segment.push([dist_tmp, segment_tmp]);
        [dist_tmp, segment_tmp] = Distance.point2point(arc1.start, arc2.end);
        dist_and_segment.push([dist_tmp, segment_tmp]);
        [dist_tmp, segment_tmp] = Distance.point2point(arc1.end, arc2.start);
        dist_and_segment.push([dist_tmp, segment_tmp]);
        [dist_tmp, segment_tmp] = Distance.point2point(arc1.end, arc2.end);
        dist_and_segment.push([dist_tmp, segment_tmp]);
        Distance.sort(dist_and_segment);
        return dist_and_segment[0];
      }
    }
    static point2polygon(point2, polygon2) {
      let min_dist_and_segment = [Number.POSITIVE_INFINITY, new Flatten.Segment()];
      for (let edge of polygon2.edges) {
        let [dist, shortest_segment] = edge.shape instanceof Flatten.Segment ? Distance.point2segment(point2, edge.shape) : Distance.point2arc(point2, edge.shape);
        if (Flatten.Utils.LT(dist, min_dist_and_segment[0])) {
          min_dist_and_segment = [dist, shortest_segment];
        }
      }
      return min_dist_and_segment;
    }
    static shape2polygon(shape, polygon2) {
      let min_dist_and_segment = [Number.POSITIVE_INFINITY, new Flatten.Segment()];
      for (let edge of polygon2.edges) {
        let [dist, shortest_segment] = shape.distanceTo(edge.shape);
        if (Flatten.Utils.LT(dist, min_dist_and_segment[0])) {
          min_dist_and_segment = [dist, shortest_segment];
        }
      }
      return min_dist_and_segment;
    }
    static polygon2polygon(polygon1, polygon2) {
      let min_dist_and_segment = [Number.POSITIVE_INFINITY, new Flatten.Segment()];
      for (let edge1 of polygon1.edges) {
        for (let edge2 of polygon2.edges) {
          let [dist, shortest_segment] = edge1.shape.distanceTo(edge2.shape);
          if (Flatten.Utils.LT(dist, min_dist_and_segment[0])) {
            min_dist_and_segment = [dist, shortest_segment];
          }
        }
      }
      return min_dist_and_segment;
    }
    static box2box_minmax(box1, box2) {
      let mindist_x = Math.max(Math.max(box1.xmin - box2.xmax, 0), Math.max(box2.xmin - box1.xmax, 0));
      let mindist_y = Math.max(Math.max(box1.ymin - box2.ymax, 0), Math.max(box2.ymin - box1.ymax, 0));
      let mindist = mindist_x * mindist_x + mindist_y * mindist_y;
      let box3 = box1.merge(box2);
      let dx = box3.xmax - box3.xmin;
      let dy = box3.ymax - box3.ymin;
      let maxdist = dx * dx + dy * dy;
      return [mindist, maxdist];
    }
    static minmax_tree_process_level(shape, level, min_stop, tree) {
      let mindist, maxdist;
      for (let node of level) {
        [mindist, maxdist] = Distance.box2box_minmax(shape.box, node.item.key);
        if (node.item.value instanceof Flatten.Edge) {
          tree.insert([mindist, maxdist], node.item.value.shape);
        } else {
          tree.insert([mindist, maxdist], node.item.value);
        }
        if (Flatten.Utils.LT(maxdist, min_stop)) {
          min_stop = maxdist;
        }
      }
      if (level.length === 0)
        return min_stop;
      let new_level_left = level.map((node) => node.left.isNil() ? void 0 : node.left).filter((node) => node !== void 0);
      let new_level_right = level.map((node) => node.right.isNil() ? void 0 : node.right).filter((node) => node !== void 0);
      let new_level = [...new_level_left, ...new_level_right].filter((node) => {
        let [mindist2, maxdist2] = Distance.box2box_minmax(shape.box, node.max);
        return Flatten.Utils.LE(mindist2, min_stop);
      });
      min_stop = Distance.minmax_tree_process_level(shape, new_level, min_stop, tree);
      return min_stop;
    }
    static minmax_tree(shape, set, min_stop) {
      let tree = new IntervalTree();
      let level = [set.index.root];
      let squared_min_stop = min_stop < Number.POSITIVE_INFINITY ? min_stop * min_stop : Number.POSITIVE_INFINITY;
      squared_min_stop = Distance.minmax_tree_process_level(shape, level, squared_min_stop, tree);
      return tree;
    }
    static minmax_tree_calc_distance(shape, node, min_dist_and_segment) {
      let min_dist_and_segment_new, stop;
      if (node != null && !node.isNil()) {
        [min_dist_and_segment_new, stop] = Distance.minmax_tree_calc_distance(shape, node.left, min_dist_and_segment);
        if (stop) {
          return [min_dist_and_segment_new, stop];
        }
        if (Flatten.Utils.LT(min_dist_and_segment_new[0], Math.sqrt(node.item.key.low))) {
          return [min_dist_and_segment_new, true];
        }
        let [dist, shortest_segment] = Distance.distance(shape, node.item.value);
        if (Flatten.Utils.LT(dist, min_dist_and_segment_new[0])) {
          min_dist_and_segment_new = [dist, shortest_segment];
        }
        [min_dist_and_segment_new, stop] = Distance.minmax_tree_calc_distance(shape, node.right, min_dist_and_segment_new);
        return [min_dist_and_segment_new, stop];
      }
      return [min_dist_and_segment, false];
    }
    static shape2planarSet(shape, set, min_stop = Number.POSITIVE_INFINITY) {
      let min_dist_and_segment = [min_stop, new Flatten.Segment()];
      let stop = false;
      if (set instanceof Flatten.PlanarSet) {
        let tree = Distance.minmax_tree(shape, set, min_stop);
        [min_dist_and_segment, stop] = Distance.minmax_tree_calc_distance(shape, tree.root, min_dist_and_segment);
      }
      return min_dist_and_segment;
    }
    static sort(dist_and_segment) {
      dist_and_segment.sort((d1, d2) => {
        if (Flatten.Utils.LT(d1[0], d2[0])) {
          return -1;
        }
        if (Flatten.Utils.GT(d1[0], d2[0])) {
          return 1;
        }
        return 0;
      });
    }
    static distance(shape1, shape2) {
      return shape1.distanceTo(shape2);
    }
  };
  Flatten.Distance = Distance;
  Flatten.BooleanOperations = BooleanOperations;
  Flatten.Relations = Relations;
  var main_esm_default = Flatten;

  // node_modules/@flatten-js/polygon-offset/dist/main.esm.js
  function arcSE(center, start, end, counterClockwise) {
    let startAngle = vector(center, start).slope;
    let endAngle = vector(center, end).slope;
    if (Utils.EQ(startAngle, endAngle)) {
      endAngle += 2 * Math.PI;
      counterClockwise = true;
    }
    let r = vector(center, start).length;
    return new Arc(center, r, startAngle, endAngle, counterClockwise);
  }
  function arcStartSweep(center, start, sweep, counterClockwise) {
    let startAngle = vector(center, start).slope;
    let endAngle = startAngle + sweep;
    if (Utils.EQ(startAngle, endAngle)) {
      endAngle += 2 * Math.PI;
      counterClockwise = true;
    } else if (Utils.GT(endAngle, 2 * Math.PI)) {
      endAngle -= 2 * Math.PI;
    } else if (Utils.LT(endAngle, -2 * Math.PI)) {
      endAngle += 2 * Math.PI;
    }
    let r = vector(center, start).length;
    return new Arc(center, r, startAngle, endAngle, counterClockwise);
  }
  function arcEndSweep(center, end, sweep, counterClockwise) {
    let endAngle = vector(center, end).slope;
    let startAngle = endAngle - sweep;
    if (Utils.EQ(startAngle, endAngle)) {
      startAngle += 2 * Math.PI;
      counterClockwise = true;
    } else if (Utils.GT(startAngle, 2 * Math.PI)) {
      startAngle -= 2 * Math.PI;
    } else if (Utils.LT(startAngle, -2 * Math.PI)) {
      startAngle += 2 * Math.PI;
    }
    let r = vector(center, end).length;
    return new Arc(center, r, startAngle, endAngle, counterClockwise);
  }
  var { unify: unify2, subtract: subtract2, BOOLEAN_UNION: BOOLEAN_UNION2 } = main_esm_default.BooleanOperations;
  var { addToIntPoints: addToIntPoints2, getSortedArray: getSortedArray2, splitByIntersections: splitByIntersections2 } = main_esm_default.BooleanOperations;
  var { removeNotRelevantChains: removeNotRelevantChains2, removeOldFaces: removeOldFaces2, restoreFaces: restoreFaces2 } = main_esm_default.BooleanOperations;
  function offset(polygon2, value) {
    let w = value;
    let edges = [...polygon2.edges];
    let offsetPolygon = polygon2.clone();
    let offsetEdge;
    if (w != 0) {
      for (let edge of edges) {
        if (edge.isSegment()) {
          offsetEdge = offsetSegment(edge.shape, w);
        } else {
          offsetEdge = offsetArc(edge.shape, w);
        }
        if (w > 0) {
          offsetPolygon = unify2(offsetPolygon, offsetEdge);
        } else {
          offsetPolygon = subtract2(offsetPolygon, offsetEdge);
        }
      }
    }
    return offsetPolygon;
  }
  function offsetArc(arc2, value) {
    let w = Math.abs(value);
    let polygon2 = new Polygon();
    let arc_cap1, arc_cap2;
    let arc_outer = arc2.clone();
    arc_outer.r = arc2.r + w;
    arc_cap1 = arcStartSweep(arc2.end, arc_outer.end, Math.PI, arc2.counterClockwise);
    arc_cap2 = arcEndSweep(arc2.start, arc_outer.start, Math.PI, arc2.counterClockwise);
    let arc_inner = void 0;
    if (arc2.r > w) {
      arc_inner = new Arc(arc2.pc, arc2.r - w, arc2.endAngle, arc2.startAngle, arc2.counterClockwise === CW ? CCW : CW);
    } else {
      arc_inner = new Segment(arc_cap1.end, arc_cap2.start);
    }
    polygon2.addFace([arc_outer, arc_cap1, arc_inner, arc_cap2]);
    [...polygon2.faces][0].setArcLength();
    let ips = Face.getSelfIntersections([...polygon2.faces][0], polygon2.edges, false);
    ips = ips.slice(0, ips.length / 2);
    let int_points = [];
    let edge_cap1;
    let edge_cap2;
    edge_cap1 = [...polygon2.edges][1];
    edge_cap2 = [...polygon2.edges][3];
    for (let pt of ips) {
      addToIntPoints2(edge_cap1, pt, int_points);
      addToIntPoints2(edge_cap2, pt, int_points);
    }
    let int_points_sorted = getSortedArray2(int_points);
    splitByIntersections2(polygon2, int_points_sorted);
    let bv = OUTSIDE;
    for (let int_point of int_points_sorted) {
      int_point.edge_before.bv = bv;
      int_point.edge_after.bv = bv == OUTSIDE ? INSIDE : OUTSIDE;
      bv = int_point.edge_after.bv;
    }
    let op = BOOLEAN_UNION2;
    removeNotRelevantChains2(polygon2, op, int_points_sorted, true);
    let num = int_points.length;
    if (num > 0) {
      let edge_before;
      let edge_after;
      edge_before = int_points_sorted[0].edge_before;
      edge_after = int_points_sorted[num - 1].edge_after;
      edge_before.next = edge_after;
      edge_after.prev = edge_before;
      int_points_sorted[0].edge_after = int_points_sorted[num - 1].edge_after;
      int_points_sorted[num - 1].edge_before = int_points_sorted[0].edge_before;
      if (num == 4) {
        edge_before = int_points_sorted[2].edge_before;
        edge_after = int_points_sorted[1].edge_after;
        edge_before.next = edge_after;
        edge_after.prev = edge_before;
        int_points_sorted[2].edge_after = int_points_sorted[1].edge_after;
        int_points_sorted[1].edge_before = int_points_sorted[2].edge_before;
      }
      removeOldFaces2(polygon2, int_points);
      restoreFaces2(polygon2, int_points, int_points);
    }
    let face0 = [...polygon2.faces][0];
    if (face0.orientation() === ORIENTATION.CCW) {
      polygon2.reverse();
    }
    return polygon2;
  }
  function offsetSegment(seg, value) {
    let w = Math.abs(value);
    let polygon2 = new Polygon();
    let v_seg = vector(seg.end.x - seg.start.x, seg.end.y - seg.start.y);
    let v_seg_unit = v_seg.normalize();
    let v_left = v_seg_unit.rotate90CCW().multiply(w);
    let v_right = v_seg_unit.rotate90CW().multiply(w);
    let seg_left = seg.translate(v_left);
    let seg_right = seg.translate(v_right).reverse();
    let cap1 = arcSE(seg.end, seg_left.end, seg_right.start, CW);
    let cap2 = arcSE(seg.start, seg_right.end, seg_left.start, CW);
    polygon2.addFace([seg_left, cap1, seg_right, cap2]);
    return polygon2;
  }
  var main_esm_default2 = offset;

  // inset/index.js
  (async () => {
    const scene = AFRAME.scenes[0].object3D;
    async function makeMesh(inset) {
      const origin = new THREE.Vector2();
      const radius = 1;
      const config = {
        holeSize: 1
      };
      const paths = await new Promise((resolve) => {
        new THREE.SVGLoader().load("/winter.svg", (svg2) => {
          resolve(svg2.paths);
        });
      });
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 300 300");
      svgs.append(svg);
      const shapes = paths.flatMap((p) => p.toShapes()).map((s) => {
        const polygon2 = new Polygon();
        polygon2.addFace(s.getPoints(6).map((p) => new Point(p.x, p.y)));
        objURL = URL.createObjectURL(new Blob([JSON.stringify(polygon2.toJSON())], { type: "application/json" }));
        document.body.innerHTML += `<a href="${objURL}">download</a>`;
        let finalPolygon;
        if (inset) {
          finalPolygon = main_esm_default2(polygon2, inset);
        } else {
          finalPolygon = polygon2;
        }
        svg.innerHTML += finalPolygon.svg();
        return new THREE.Shape(finalPolygon.vertices);
      });
      const geo = new THREE.ExtrudeGeometry(shapes, { curveSegments: 3, depth: radius * 1, bevelEnabled: false });
      const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: inset ? "red" : "grey", wireframe: false }));
      mesh.scale.setScalar(0.01);
      return mesh;
    }
    const outer = await makeMesh();
    scene.add(outer);
  })();
})();
//# sourceMappingURL=inset-bundle.js.map
